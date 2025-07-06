import { input, select } from '@inquirer/prompts'
import { Args, Command, Flags } from '@oclif/core'
import { createVoteAccount, fileExists, getInventoryItem, runAnsiblePlaybook } from '../../lib/utils.js'
import { SDO_HOME } from '../../lib/constants.js'

export default class ValidatorProvision extends Command {
  static override args = {

  }
  static override description = 'Provision a validator node'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    pubkey: Flags.string({ char: 'p', description: 'validator public key' }),
    network: Flags.string({ char: 'n', description: 'network to use' }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(ValidatorProvision)

    let network = flags.network
    if (!network) {
      network = await select({
        message: 'What is the validator network?',
        choices: ['testnet', 'mainnet'],
        default: 'testnet',
      })
    }
    if (!network) {
      this.error('Network is required')
    }

    let pubkey = flags.pubkey
    if (!pubkey) {
      pubkey = await input({
        message: 'What is the validator public key?',
      })
    }
    if (pubkey.trim() === '') {
      this.error('Validator public key is required')
    }

    runAnsiblePlaybook('provision_node.yml', network, pubkey)
  }
}
