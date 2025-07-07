---
title: Provisioning Validator
parent: Getting Started
nav_order: 2
---
Once you have provided the values in the creating validator guide, `sdo` will take over and perform initial configuration on the server which is creating a user named `sdo`, giving it `sudo` privilidges, and setup sane defaults on the server for SSH. After performing these steps, `sdo` will exit with next commands displayed to be executed.

The command to provision the server is 
```bash
sdo validator provision
```
If executed without providing any values for flags which are network and pubkey of validator, `sdo` will ask for the following

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
After getting the values for network and public key of validator, `sdo` takes over and performs a lenghty series of operations on the server. A word of caution, in case of Firedancer, it will take some time to build it. So! don't be quick to think that the operations are stuck, give it some time and eventually it will start the validator software.