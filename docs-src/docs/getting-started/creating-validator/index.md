---
title: Creating Validator
parent: Getting Started
nav_order: 1
---
- TOC
{:toc}
sdo expects the following present on your system before its installation and operation.
### OS
Linux or MacOSX. For Windows, kindly use [WSL2 for Windows](https://learn.microsoft.com/en-us/windows/wsl/install)
### PACKAGES
* [NodeJS](https://nodejs.org/en/download)
* [Python 3](https://www.python.org/downloads/)
* [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)
* [Solana](https://solana.com/ru/docs/intro/installation)

### INSTALLATION
```bash
npm install -g @skipline/sdo
```

### VALIDATOR CREATION
```bash
sdo validator create
```

### 1. Validator network
```bash
? What is the validator network? (Use arrow keys)
❯ testnet
  mainnet
```

```bash
✔ What is the validator network? testnet
```

### 2. Username for SSH connection to server
This depends upon your OS installed on the server and later its configuration for a new user. Default value is `root`.

```bash
? What is the SSH user to connect as? (root)
```

```bash
✔ What is the SSH user to connect as? root
```

### 3. IP address of the server
This is the IP of the server to which SSH connection is to be established.

```bash
? What is the IP address of the validator server?
```

```bash
✔ What is the IP address of the validator server? 191.205.133.188
```

### 4. Private key path of the SSH user
Supply the path to private key pair which allow previously entered user to access the machine via SSH. In most case, it is at located in `~/.ssh/`. The default value reflects that.

```bash
? What is the path to the SSH private key? (~/.ssh/id_rsa)
```

```bash
✔ What is the path to the SSH private key? ~/.ssh/id_rsa
```

### 5. SSH connection check
Once you have supplied the above values, the command prompt will display an indicator that a SSH connection is being established.
```bash
⠴ Connecting to validator via SSH...
```
If the connection is established with success, the prompt is going to indicate it like this
```bash
SSH connection established successfully
```
In failure case, the relevant error is displayed and sdo will exit.

### 6. Validator software
Select the validator software to deploy on the server. In testnet's case, following are the options.
```bash
? Choose validator type (Use arrow keys)
❯ Agave
  Firedancer
```

```bash
✔ Choose validator type Agave
```
In mainnet's case, the options are as below
```bash
? Choose validator type (Use arrow keys)
❯ Jito
  Firedancer
```

```bash
✔ Choose validator type Jito
```

### 7. Validator identity public key
Now choose between providing the Identity public key for validator or generate new one. Default is No meaning you will have to provide public key of existing keypair.
```bash
? Do you want to generate a new validator identity keypair? (y/N)
✔ Do you want to generate a new validator identity keypair? No
```

```bash
✔ Enter the existing validator identity keypair 32nTAQSAxzSbvURguFvfz5FX1g4enbvgyttMYHr1KJqM
```
After entering the public key, sdo is going to ask you to place the keypair at `~/.sdo/keys` directory with name of the keypair as `<publickey>.json`
```bash
Make sure the keypair exists at ~/.sdo/keys/32nTAQSAxzSbvURguFvfz5FX1g4enbvgyttMYHr1KJqM.json
```

### 8. Server Name
For your own purpose, you can given the validator server a name which will be stored in `slv config` for the validators. Default name will be public key of the validator if you don't provide one.
```bash
? Enter a name for the validator (32nTAQSAxzSbvURguFvfz5FX1g4enbvgyttMYHr1KJqM)
✔ Enter a name for the validator 32nTAQSAxzSbvURguFvfz5FX1g4enbvgyttMYHr1KJqM
```

### 9. Validator vote key
You have to choose between providing the vote public key for validator or generate new one. Default is No meaning you will have to provide public key of existing keypair.
```bash
? Do you want to generate a new validator vote keypair? (y/N)
✔ Do you want to generate a new validator vote keypair? No
```

```bash
✔ Enter the existing validator vote keypair hsCzPbphXyJnwxXfD5HfpjT5vgYZvLKSU7ZLrVxDSLV
```
After entering the public key, sdo is going to ask you to place the keypair at `~/.sdo/keys` directory with name of the keypair as `<publickey>.json`
```bash
Make sure the keypair exists at ~/.sdo/keys/hsCzPbphXyJnwxXfD5HfpjT5vgYZvLKSU7ZLrVxDSLV.json
```

### 10. Validator authority key
As a last step, select between providing the authority public key for validator or generate new one. Default is `No` meaning you will have to provide public key of existing keypair.
```bash
? Do you want to generate a new validator authority keypair? (y/N)
✔ Do you want to generate a new validator authority keypair? No
```

```bash
✔ Enter the existing validator authority keypair DCfCsPvYV5qnxWdDgrgpzh3A2jPKPfgzg8J58PaAWZyX
```
After entering the public key, sdo is going to ask you to place the keypair at `~/.sdo/keys` directory with name of the keypair as `<publickey>.json`
```bash
Make sure the keypair exists at ~/.sdo/keys/DCfCsPvYV5qnxWdDgrgpzh3A2jPKPfgzg8J58PaAWZyX.json
```

