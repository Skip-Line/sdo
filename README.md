sdo
=================

A CLI tool which enables operators of Solana Validators to create new or manage existing validators. It comes with a P2P switch over utility for active and backup nodes. The identity switch over process completes in milliseconds.

## PREREQUISTES

### OS
Linux or MacOSX. For Windows, kindly use [WSL2 for Windows](https://learn.microsoft.com/en-us/windows/wsl/install)

### PACKAGES

* [NodeJS](https://nodejs.org/en/download)
* [Python 3](https://www.python.org/downloads/)
* [Asnbile](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)
* [Solana](https://solana.com/ru/docs/intro/installation)

### INTRO
<!-- toc -->
* [Installation](#installion)
* [Upgdating](#updating)
* [Docs](#docs)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Installation
```bash
npm install -g @skipline/sdo
```
# Docs
For detailed information about commands and guides, kindly visit the full docs at [https://skip-line.github.io/sdo/](https://skip-line.github.io/sdo/)
# Updating
```bash
npm update -g @skipline/sdo
```
# Usage
<!-- usage -->
```sh-session
$ sdo COMMAND
running command...
$ sdo (--version)
sdo/0.1.0 darwin-x64 node-v22.17.0
$ sdo --help [COMMAND]
USAGE
  $ sdo COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`sdo validator create`](#sdo-validator-create)
* [`sdo validator provision`](#sdo-validator-provision)
* [`sdo validator set-active-identity`](#sdo-validator-set-active-identity)
* [`sdo validator generate-vote-account`](#sdo-validator-generate-vote-account)
* [`sdo validator switch-hosts-p2p`](#sdo-validator-switch-hosts-p2p)


## `sdo validator create`

Creates a new validator on Solana mainnet or testnet.

```
USAGE
  $ sdo validator create

FLAGS
  -n, --network=<value>  (required) Which network the validator node operates on (mainnet|testnet)
  -u, --user=<value>     (required) Which user name to establish connection to server via SSH
  -i, --ip=<value>       (required) IP of the server
  -k, --key=<value>      (required) Path to the SSH key for connecting to server via SSH

DESCRIPTION
  This command is used create validator in the respective directory on localhost for later ops. It further adds a default sdo user to the server to provision it and setups saner settings for SSH.
  This command can take values for network, user, ip, and public key path at initial prompt and will perform SSH connection check.  
  Upon success, rest of the properties for the server like software type, keys, and commission are obtained through the the command prompt. You can either supply already generated Identity, Vote, Withdraw Auhtority keys or sdo will generate new ones for you. 

EXAMPLES
  $ sdo validator create -n testnet -u vagrant -i 192.168.33.10 -k ~/.ssh/id_rsa
  SSH connection established successfully

```
### Rest of the selection goes like this
```
  $? Choose validator type (Use arrow keys)
    ❯ Agave
      Firedancer
  $✔ Choose validator type Agave
  
  $? Do you want to generate a new validator identity keypair? (y/N) N
  $✔ Enter the existing validator identity keypair sdoEAGtkL2guBHMjqP8bbBh3PNRnUDGEkNDP7ynY8zH
    Make sure the keypair exists at ~/.sdo/keys/sdoEAGtkL2guBHMjqP8bbBh3PNRnUDGEkNDP7ynY8zH.json

  $? Enter a name for the validator (sdoEAGtkL2guBHMjqP8bbBh3PNRnUDGEkNDP7ynY8zH) vgbox
  $✔ Enter a name for the validator vgbox

  $? Do you want to generate a new validator vote keypair? (y/N) N
  $✔ Do you want to generate a new validator vote keypair? No
  $✔ Enter the existing validator vote keypair sdo6T7vukgDmwy9EMZhqkxbLwkAQC3BaTSLyfeCB7cK
    Make sure the keypair exists at ~/.sdo/keys/sdo6T7vukgDmwy9EMZhqkxbLwkAQC3BaTSLyfeCB7cK.json
  
  $? Do you want to generate a new withdraw authority keypair? (y/N) N
  $✔ Do you want to generate a new withdraw authority keypair? No
  $✔ Enter the existing validator vote keypair sdoPDvERE2CnHRBHwCPEKu9AP8QVcdjxgAMaGVQBWE8
    Make sure the keypair exists at ~/.sdo/keys/sdoPDvERE2CnHRBHwCPEKu9AP8QVcdjxgAMaGVQBWE8.json
```

### Upon successfull values entry
Once all the values have been supplied, the command executes an ansible playbook which takes care of sdo user creation and setting up SSH defaults. The out put would be like this.
```
PLAY [Create specific user sdo for Validator OPS and setup SSH] ****************

TASK [Gathering Facts] *********************************************************

ok: [192.168.33.10]

TASK [user : Create user sdo] **************************************************

changed: [192.168.33.10]

TASK [user : Add sdo to sudoers with NOPASSWD] *********************************

changed: [192.168.33.10]

TASK [user : Add ssh public key for sdo user] **********************************

changed: [192.168.33.10]

TASK [sshd : Install latest SSH server and client] *****************************

ok: [192.168.33.10] => (item={'key': 'openssh-server', 'value': 'latest'})
ok: [192.168.33.10] => (item={'key': 'openssh-client', 'value': 'latest'})
ok: [192.168.33.10] => (item={'key': 'acl', 'value': 'latest'})

TASK [sshd : Create a secure sshd_config] **************************************

changed: [192.168.33.10]

TASK [sshd : Create a secure ssh_config] ***************************************

changed: [192.168.33.10]

PLAY RECAP *********************************************************************
192.168.33.10              : ok=7    changed=5    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   


✅ sdo user creation and ssh setup was successfull
To provision the validator node, kindly run
sdo validator provision -n testnet -p sdoEAGtkL2guBHMjqP8bbBh3PNRnUDGEkNDP7ynY8zH
```




## `sdo validator provision`

Provisions the server with all the components required to run the validator.

```
USAGE
  $ sdo validator provision

FLAGS
  -n, --network=<value>  (required) Which network the validator node operates on (mainnet|testnet)
  -p, --pubkey=<value>     (required) Public identity key of the validator

DESCRIPTION
  This command performs all the operations to configure the validator node and eventually starts up the validator software.

EXAMPLES
  $ sdo validator provision -n testnet -p sdoEAGtkL2guBHMjqP8bbBh3PNRnUDGEkNDP7ynY8zH
```

## `sdo validator set-active-identity`

Changes the validator's unstaked identity to active and staked one.

```
USAGE
  $ sdo validator set-active-identity

FLAGS
  -n, --network=<value>  (required) Which network the validator node operates on (mainnet|testnet)
  -p, --pubkey=<value>     (required) Public identity key of the validator

DESCRIPTION
  By default, when the validator is started it is set to bootup with unstaked and vanity identity. This command changes that to active and stake public identity key of validator

EXAMPLES
  $ sdo validator set-active-identity -n testnet -p sdoEAGtkL2guBHMjqP8bbBh3PNRnUDGEkNDP7ynY8zH
```

## `sdo validator generate-vote-account`

Creates a new vote account for the given keys.

```
USAGE
  $ sdo validator generate-vote-account

FLAGS
  -n, --network=<value>  (required) Which network the validator node operates on (mainnet|testnet)
  -p, --pubkey=<value>     (required) Public identity key of the validator

DESCRIPTION
  Creates a vote account for the validator to start operating on chain. You must have > 0 SOL balance in the default account of localhost to perform this operation.

EXAMPLES
  $ sdo validator set-active-identity -n testnet -p sdoEAGtkL2guBHMjqP8bbBh3PNRnUDGEkNDP7ynY8zH
```

## `sdo validator switch-hosts-p2p`

This command lets you switch over between validator nodes in milliseconds given both are caught up. If the nodes are provisioned with `sdo`, a plain command with necessary variables is enough. If the nodes are provisioned already, the operator needs to specify a `yml` file which contains the necessary variables.

```
USAGE
  $ sdo validator switch-hosts-p2p

FLAGS
  -n, --network=<value>  (required) Which network the validator node operates on (mainnet|testnet)
  -a, --active=<value>   (required) Public identity key of the active validator
  -b, --backup=<value>   (required) Public identity key of the backup validator
  -c, --config=<value>   (optional) Path to the yml file which holds the values for both nodes

DESCRIPTION
  An inventory file to be used by `sdo` needs to be created before running this command in any case. The operator needs to use `validator create` command and supply respective values. Once the nodes are configured to be used by `sdo`, this command can be run. It is simple if the nodes are also provisioned by `sdo` to prepare the validator server. 

  If nodes have been not configured by`sdo`, the operator needs to specify the given values in `conf.yml.sample`. 

  

EXAMPLES
  $ sdo validator switch-hosts-p2p -n testnet -a sdoEAGtkL2guBHMjqP8bbBh3PNRnUDGEkNDP7ynY8zH -b  sdoPJRoLhCYPE4Fi698P7EVcypz6SGobAbp4oGAjpuq

  $sdo validator switch-hosts-p2p -n testnet -a sdoEAGtkL2guBHMjqP8bbBh3PNRnUDGEkNDP7ynY8zH -b  sdoPJRoLhCYPE4Fi698P7EVcypz6SGobAbp4oGAjpuq -c conf.yml


```


## LICENSE
The code is available under [MIT License](https://mit-license.org)