---
title: Generating Vote Account 
parent: Getting Started
nav_order: 3
---
In order for your validator to work on the Solana network, a vote account is needed to be create for the voting keypair your provided while creating the validator. While your node is being provisioned, you can do the necessary work of creating the vote account.

Before executing the `sdo` command, make sure that there is some SOL on your localhost's default Solana account. In case of testnet, you can simply request some SOL by sending a request like this
```bash
solana airdrop 1
```

Once you have balance in the account, and all the keys are in `~/.slv/keys` directory, execute the following
```bash
sdo validator generate-vote-account
```
It will ask for the network and public key of the validator.
```bash
? What is the validator network? (Use arrow keys)
❯ testnet
  mainnet
✔ What is the validator network? testnet
```
Once chosen the network upon which the validator is supposed to be deployed, you will be asked to provide identity public key of the validator.
```bash
? What is the validator public key?
✔ What is the validator public key? 32nTAQSAxzSbvURguFvfz5FX1g4enbvgyttMYHr1KJqM
```
In case everything is in place, a new vote account will be generated fot the vote keypair specified. In case of testnet, the commission is set to 100% and on main net it has to be provided by the user while creating validator.