import { input, select } from '@inquirer/prompts'
import { Args, Command, Flags } from '@oclif/core'
import { runAnsiblePlaybook } from '../../lib/utils.js'


export default class ValidatorSetUnstaked extends Command {
  static override args = {

  }
  static override description = 'Set validator identity to unstaked'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    network: Flags.string({
      char: 'n',
      description: 'Network where validator is deployed',
    }),
    pubkey: Flags.string({
      char: 'p',
      description: 'Pub key of the validator',
    }),

  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(ValidatorSetUnstaked)

    let network = flags.network
    if (!network) {
      network = await select({
        message: 'What is the validator network?',
        choices: ['testnet', 'mainnet'],
      })
    }

    let pubkey = flags.pubkey
    if (!pubkey) {
      pubkey = await input({
        message: 'What is the pub key of the validator?',
      })
    }
    if (pubkey.trim() === '') {
      this.error('Validator pub key is required')
    }

    runAnsiblePlaybook("set_unstaked.yml", network!, pubkey)


  }
}