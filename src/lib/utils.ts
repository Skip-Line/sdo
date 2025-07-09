import fs from 'fs';
import { execSync, spawn } from 'child_process';
import { stringify, parse } from 'yaml';
import { rootPathToAnsible, SDO_HOME } from './constants.js';
import path, { dirname } from 'path';

export function moveFile(source: string, destination: string) {
    fs.mkdirSync(dirname(destination), { recursive: true });
    fs.rename(source, destination, (error) => {
        if (error) {
            let sourceStream = fs.createReadStream(source);
            let destinationStream = fs.createWriteStream(destination);
            sourceStream.pipe(destinationStream);
            sourceStream.on('error', (err) => {
                console.error(`Error reading from source file: ${err.message}`);
            }
            );
            sourceStream.on('end', () => {
                fs.unlink(source, (unlinkError) => {
                    if (unlinkError) {
                        console.error(`Error deleting source file: ${unlinkError.message}`);
                    }
                });
            });

        }
    });
}

export function runAnsiblePlaybook(playbookName: string, network: string, limit: string = 'all') {

    let ansiblePath = rootPathToAnsible();
    let playbookPath = `${ansiblePath}/${playbookName}`;

    let inventoryPath = `${SDO_HOME}/${network}-inventory.yml`;

    console.log(`Running Ansible playbook: ${playbookPath} with inventory: ${inventoryPath} and limit: ${limit}`);

    const spawned = spawn('ansible-playbook', ['-i', inventoryPath, playbookPath, '--limit', limit]);
    spawned.stdout.on('data', (data) => {
        console.log(`${data}`);
    });
    spawned.stderr.on('data', (data) => {
        console.error(`${data}`);
    });
    spawned.on('close', (code) => {
        if (code !== 0) {
            console.error(`Failed with code ${code}`);
        } else {
            if (playbookName === "provision_node.yml") {
                console.log('✅ Node provisioned successfully');
                console.info('Kindly run if you haven\'t created a vote account');
                console.info(`sdo validator create-vote-account -n ${network} -p ${limit}`)
                console.info(`If vote account exists or new is created, kindly run after the node has caught up:`)
                console.info(`sdo validator set-active-identity -n ${network} -p ${limit}`)
            } else if (playbookName === "set_unstaked.yml") {
                console.log('✅ Validator is set to unstaked key');
            } else {
                console.log('✅ Task executed successfully');
            }
        }
    });
}

export function runSdoUserPlaybook(user: string, authMethod: string, authInfo: string, ip: string, pubkey: string, network: string, limit: string = 'all') {
    let ansiblePath = rootPathToAnsible();
    let playbookPath = `${ansiblePath}/setup_user_and_ssh.yml`;

    let spawned;
    if (authMethod === 'Key') {
        spawned = spawn('ansible-playbook', ['-i', ip + ',', playbookPath, '--limit', limit, '--user', user, '--private-key', authInfo]);
    } else {
        spawned = spawn('ansible-playbook', ['-i', ip + ',', playbookPath, '--limit', limit, '--user', user, '-e', `ansible_password=${authInfo}`]);
    }
    spawned.stdout.on('data', (data) => {
        console.log(`${data}`);
    });
    spawned.stderr.on('data', (data) => {
        console.error(`${data}`);
    });
    spawned.on('close', (code) => {
        if (code !== 0) {
            console.error(`Failed with code ${code}`);
        } else {
            console.log('✅ sdo user creation and ssh setup was successfull')
            console.log(`To provision the validator node, kindly run`);
            console.log(`sdo validator provision -n ${network} -p ${pubkey}`);
        }
    });
}

export function writeInventoryFile(inventoryPath: string, content: Record<string, any>, network: string) {
    let yamlContent;
    try {
        fs.statSync(inventoryPath);
        let existingContent = fs.readFileSync(inventoryPath, 'utf8');
        let existingData = parse(existingContent);
        let key = Object.keys(content)[0]
        let host = existingData[network].hosts[key];
        if (host) {
            existingData[network].hosts[key] = content[key];
            yamlContent = stringify(existingData);
        }
        else {
            existingData[network].hosts = { ...existingData[network].hosts, ...content };
            yamlContent = stringify(existingData);
        }

    } catch (error) {
        fs.mkdirSync(dirname(inventoryPath), { recursive: true });
        let inventory = {
            [network]: {
                hosts: content
            }
        };
        yamlContent = stringify(inventory);
    }
    fs.writeFileSync(inventoryPath, yamlContent!, 'utf8');
}

export function createVoteAccount(identity: string, vote: string, authority: string, commission: string, network: string) {
    const home = SDO_HOME;

    // if (fileExists(`${home}/keys/${identity}.json`) && fileExists(`${home}/keys/${vote}.json `)) {

    const rpcUrl = network === 'mainnet' ? 'https://api.mainnet-beta.solana.com' : 'https://api.testnet.solana.com';
    const balance = checkBalance(rpcUrl);

    if (balance) {
        try {
            execSync(`solana create-vote-account ${home}/keys/${vote}.json ${home}/keys/${identity}.json ${authority} --commission ${commission} --url ${rpcUrl}`);
            console.log('✅ Vote account created successfully');
            console.info('Kindly run if you haven\'t provisioned the validator');
            console.info(`sdo validator provision -n ${network} -p ${identity}`)
            console.info(`If node is already provisioned, in case of a fresh node kindly run:`)
            console.info(`sdo validator set-active-identity -n ${network} -p ${identity}`)
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Error creating vote account: ${error.message}`);
            } else {
                console.error(`Error creating vote account: ${String(error)}`);
            }
        }
    }
    // }
}

export function fileExists(filePath: string): boolean {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch (error) {
        console.error(`File does not exist: ${filePath}`);
        return false;
    }
}

export function checkBalance(rpcUrl: string): boolean {
    try {
        const balance = execSync(`solana balance --url ${rpcUrl}`).toString().trim();
        const amount = parseFloat(balance);
        if (isNaN(amount) || amount <= 0) {
            console.error(`Insufficient SOL balance: ${balance}`);
            return false;
        }
        return true;
    } catch (error) {
        console.error(`Error checking balance: ${String(error)}`);
        return false;
    }
}

export function getInventoryItem(key: string, network: string) {
    const inventoryPath = `${SDO_HOME}/${network}-inventory.yml`;
    if (!fileExists(inventoryPath)) {
        console.error(`Inventory file does not exist: ${inventoryPath}`);
        return null;
    }

    const inventory = parse(fs.readFileSync(inventoryPath, 'utf8'));
    return inventory[network]?.hosts[key] || null;
}

export function getAnsibleCmdPath(): string {
    return execSync('which ansible').toString().trim();
}