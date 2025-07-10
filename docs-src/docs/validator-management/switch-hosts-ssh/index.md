---
title: Switch active and hot backup
parent: Managing Validator
nav_order: 1
---
There will be many occasions where an opeartor has to deal with moving the active validator to another node. `sdo` makes it simple by providing a single command to do that.
```bash
 sdo validator switch-hosts-ssh
 ```

It will ask for the network and public key of the validator.
```bash
? What is the validator network? (Use arrow keys)
❯ testnet
  mainnet
✔ What is the validator network? testnet
```
Once chosen the network, `sdo` will ask for pubkey of active validator
```bash
? What is the public key of active validator?
✔ What is the public key of active validator? 32nTAQSAxzSbvURguFvfz5FX1g4enbvgyttMYHr1KJqM
```
Next provide the public key of hot backup validator node. This key should be the one defined when you created the backup validator.
```bash
? What is the public key of hot backup validator?
✔ What is the public key of hot backup validator? sdobhP2sSx2d3nb4UMMg6bnKeeWXgSMkGLzFxeSC6tG
```
Rest will be taken care of by `sdo`. It will also update the inventory file to reflect changes in the nodes.