---
title: Set active identity to unstaked
parent: Managing Validator
nav_order: 2
---
`sdo` provides a single command to set active identity of a validator to unstaked one.
```bash
 sdo validator set-unstaked
 ```

It will ask for the network and public key of the validator.
```bash
? What is the validator network? (Use arrow keys)
❯ testnet
  mainnet
✔ What is the validator network? testnet
```
Once chosen the network, `sdo` will ask for pubkey of the validator
```bash
? What is the public key of active validator?
✔ What is the public key of active validator? 32nTAQSAxzSbvURguFvfz5FX1g4enbvgyttMYHr1KJqM
```
`sdo` will take care of the rest.