---
title: Setting Active Identity
parent: Getting Started
nav_order: 4
---
After creating validator, provisioning it, and generating vote account, it is time to check whether validator has been setup correctly. Login to your server as `sdo` user and execute follwing command
```bash
agave-validator -l /mnt/ledger monitor
```
In case everything goes according to plan, you should see some output like this with numbers varied 
```bash
Ledger location: /mnt/ledger/
Identity: 32nTAQSAxzSbvURguFvfz5FX1g4enbvgyttMYHr1KJqM
Genesis Hash: 4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY
⠐ 125:43:28 | Processed Slot: 344033427 | Confirmed Slot: 344033426 | Finalized Slot: 344033389 | Full Snapshot Slot: 344024662 | Incremental Sna
```
 There might be some varied input like downloading snapshot, catching up or, loading ledger. In that case, the startup has'nt completed. Wait for it to complete.

 `sdo` sets up the validator with a random and unstaked identity to avoid problems like double voting and etc. So, in order to finally go online on Solana's network, you have to change it with the identity public key supplied at start. Run the following command on your local computer to do that

 ```bash
 sdo validator set-active-identity
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
If the startup of validator is complete, `sdo` will change the public key of validator from unstaked to active one. That's it. Now you have a running validator on Solana's network.