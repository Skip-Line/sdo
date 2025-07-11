import { Args, Command, Flags } from '@oclif/core'
import { input, select, confirm, password } from '@inquirer/prompts'
import { promisify } from 'util'
import { exec as execCallback, spawn, spawnSync } from 'child_process'
import yoctoSpinner from 'yocto-spinner'
import { createVoteAccount, getAnsibleCmdPath, getInventoryItem, moveFile, runAnsiblePlaybook, runSdoUserPlaybook, writeInventoryFile } from "../../lib/utils.js"
import { SDO_HOME } from '../../lib/constants.js'
import { statSync } from 'fs'
import { rootPathToAnsible } from '../../lib/constants.js'

const exec = promisify(execCallback)


export default class ValidatorCreate extends Command {
  static override args = {

  }
  static override description = 'Create a new validator'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    network: Flags.string({ char: 'n', description: 'Network to deploy validator on' }),
    user: Flags.string({ char: 'u', description: 'SSH User to connect as' }),
    ip: Flags.string({ char: 'i', description: 'IP address of the validator server' }),
    key: Flags.string({ char: 'k', description: 'Path to the SSH private key' }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(ValidatorCreate)


    let ip = flags.ip
    if (!ip) {
      ip = await input({
        message: 'What is the IP address of the validator server?',
      })
    }
    if (ip.trim() === '') {
      this.error('IP address is required')
    }

    let sshUser = flags.user
    if (!sshUser) {
      sshUser = await input({
        message: 'What is the SSH user to connect as?',
        default: "root"
      })
    }
    if (sshUser.trim() === '') {
      this.error('SSH user is required')
    }

    let authMethod: string
    if (!flags.key) {
      authMethod = await select({
        message: 'How do you want to authenticate?',
        choices: ['Key', 'Password'],
        default: 'Key',
      })

      let key = flags.key;
      let sshPassword;
      if (authMethod === 'Key' && !key) {
        key = await input({
          message: 'What is the path to the SSH private key?',
          default: `~/.ssh/id_rsa`
        })
        if (key.trim() === '') {
          this.error('SSH private key path is required')
        }
      } else {
        sshPassword = await password({
          message: 'Enter the SSH password for the user',
          mask: '*',
        })
      }

      const spinner = yoctoSpinner()
      spinner.start('Connecting to validator via SSH...')
      try {
        if (authMethod === 'Key') {
          await exec(`ansible --ssh-common-args='-o StrictHostKeyChecking=no' -i ${ip}, -u ${sshUser} --private-key=${key} -m ping all`)
        } else {
          let ansibleCmd = getAnsibleCmdPath();
          await exec(`ansible --ssh-common-args='-o StrictHostKeyChecking=no' -i ${ip}, -u ${sshUser} -e "ansible_password=${sshPassword}" -m ping all`)
        }
        spinner.stop('SSH connection established successfully')

        let network = flags.network
        if (!network) {
          network = await select({
            message: 'What is the validator network?',
            choices: ['testnet', 'mainnet'],
          })
        }
        if (!network) {
          this.error('Network is required')
        }

        let validatorType, jitoCommission, jitoRegion, commission;
        if (network === 'testnet') {
          validatorType = await select({
            message: 'Choose validator type',
            choices: ['Agave', 'Firedancer'],
            default: 'Agave',
          })
        } else if (network === 'mainnet') {
          validatorType = await select({
            message: 'Choose validator type',
            choices: ['Jito', 'Firedancer'],
            default: 'Jito',
          })
          commission = await input({
            message: 'Enter the commission percentage (0-100) for Validator',
            default: '5',
          })
          jitoCommission = await input({
            message: 'Enter the Jito commission percentage (0-100)',
            default: '10',
          })

          jitoRegion = await select({
            message: 'Select the Jito region for the validator',
            choices: ['Amsterdam', 'Frankfurt', 'London', 'New York', 'Salt Lake City', 'Singapore', 'Tokyo'],
            default: 'Amsterdam',
          })
        } else {
          this.error(`Unknown network: ${network}`)
        }



        let validatorIdentityKey = await this.genOrGetKeypair("validator identity");
        let name = await input({
          message: 'Enter a name for the validator',
          default: validatorIdentityKey
        })
        let validatorVoteKey = await this.genOrGetKeypair("validator vote");
        let withdrawAuthorityKey = await this.genOrGetKeypair("withdraw authority");


        let inventory;

        if (network === 'testnet') {
          inventory = {

            [validatorIdentityKey!]: {
              server_name: name,
              validator_identity_key: validatorIdentityKey,
              validator_vote_key: validatorVoteKey,
              withdraw_authority_key: withdrawAuthorityKey,
              validator_type: validatorType,
              ansible_user: "sdo",
              ansible_host: ip,
              ansible_ssh_private_key_file: key,
              commission: "100",
            }


          }
        } else if (network === 'mainnet') {

          if (jitoRegion === "New York") {
            jitoRegion = "nyc"
          } else if (jitoRegion === "Salt Lake City") {
            jitoRegion = "slc"
          }

          inventory = {

            [validatorIdentityKey!]: {
              server_name: name,
              validator_identity_key: validatorIdentityKey,
              validator_vote_key: validatorVoteKey,
              withdraw_authority_key: withdrawAuthorityKey,
              validator_type: validatorType,
              jito_commission: jitoCommission,
              jito_region: jitoRegion,
              commission,
              ansible_user: "sdo",
              ansible_host: ip,
              ansible_ssh_private_key_file: key,

            }
          }
        }
        let inventoryPath = `${SDO_HOME}/${network}-inventory.yml`
        writeInventoryFile(inventoryPath, inventory!, network)

        let authInfo;
        if (authMethod === 'Key') {
          authInfo = key!
        } else {
          authInfo = sshPassword!
        }
        runSdoUserPlaybook(sshUser, authMethod, authInfo, ip, validatorIdentityKey!, network)


      } catch (error) {
        spinner.stop('Failed to connect to validator')
        if (error instanceof Error) {
          this.error(`❌ ${error.message}`)
        } else {
          this.error(`❌ ${String(error)}`)
        }
      }

    }
  }

  private async genOrGetKeypair(type: string) {
    const spinner = yoctoSpinner()
    let key;
    let generateKeypair = await confirm({
      message: `Do you want to generate a new ${type} keypair?`,
      default: false,
    })
    if (generateKeypair) {
      // Generate keypair logic here
      spinner.start(`Generating new ${type} keypair...`)
      try {
        const { stdout } = await exec(`solana-keygen grind --no-bip39-passphrase --starts-with sdo:1 `)
        const output = stdout.match(/Wrote keypair to (\S+)\.json/)

        if (output) {
          let fileName = `${output[1]}.json`
          moveFile(fileName, `${SDO_HOME}/keys/${fileName}`)
          spinner.stop(`✅ New ${type} keypair generated successfully. Key is:  ${output[1]}`)
          key = output[1]
        }
      } catch (error) {
        spinner.stop(`Failed to generate new ${type} keypair`)
        if (error instanceof Error) {
          this.error(`❌ Error generating new ${type} keypair: ${error.message}`)
        }
        this.error(`❌ Error generating new ${type} keypair: ${String(error)}`)
      }
    } else {
      // Use existing keypair logic here
      let existingKeypair = await input({
        message: `Enter the existing ${type} keypair`,

      })
      if (existingKeypair.trim() === '') {
        this.error(`${type} keypair is required`)
      }
      this.log("\n")
      this.log(`Make sure the keypair exists at ~/.sdo/keys/${existingKeypair.trim()}.json`)
      this.log("\n")
      key = existingKeypair
    }
    return key;
  }

  private async handlePassword() {
    let pwdFile = `${SDO_HOME}/pwd.yml`
    try {
      statSync(pwdFile)

    } catch (error) {
      let pwd = await this.getPwdFromInput()
    }



  }

  private async getPwdFromInput() {
    let sdoPwd1st = await password({
      message: 'Enter the password for sdo user on the validator',
      mask: '*',
      validate: (input) => {
        if (input.trim().length < 8) {
          return 'Password must be at least 8 characters long';
        }
        return true;
      },
    })
    let sdoPwd2nd = await password({
      message: 'Confirm the password for sdo user on the validator',
      mask: '*',
      validate: (input) => {
        if (input.trim().length < 8) {
          return 'Password must be at least 8 characters long';
        }
        return true;
      },
    })
    if (sdoPwd1st !== sdoPwd2nd) {
      this.error('Passwords do not match. Please try again.')
    }
    return sdoPwd1st
  }

}
