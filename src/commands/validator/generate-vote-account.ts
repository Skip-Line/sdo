import { input, select } from '@inquirer/prompts'
import { Args, Command, Flags } from '@oclif/core'
import { createVoteAccount, getInventoryItem } from '../../lib/utils.js'

export default class ValidatorGenerateVoteAccount extends Command {
  static override args = {

  }
  static override description = 'Generate a vote account for the validator'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    network: Flags.string({ char: 'n', description: 'Network where validator is located' }),
    pubkey: Flags.string({ char: 'p', description: 'Public key of the validator' }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(ValidatorGenerateVoteAccount)

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

    let pubkey = flags.pubkey
    if (!pubkey) {
      pubkey = await input({
        message: 'What is the public key of the validator?',
      })
    }
    if (pubkey.trim() === '') {
      this.error('Public key is required')
    }

    let hostDetails = getInventoryItem(pubkey, network);
    if (hostDetails) {
      createVoteAccount(hostDetails.validator_identity_key, hostDetails.validator_vote_key, hostDetails.withdraw_authority_key, hostDetails.commission, network)
    }

  }
}
