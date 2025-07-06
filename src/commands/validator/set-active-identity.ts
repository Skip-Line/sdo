import { input, select } from '@inquirer/prompts'
import { Args, Command, Flags } from '@oclif/core'
import { fileExists, runAnsiblePlaybook } from '../../lib/utils.js'
import { SDO_HOME } from '../../lib/constants.js'

export default class ValidatorSetActiveIdentity extends Command {
  static override args = {

  }
  static override description = 'Set the active identity for the validator'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    network: Flags.string({ char: 'n', description: 'Network where validator is located' }),
    pubkey: Flags.string({ char: 'p', description: 'Public key of the validator' }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(ValidatorSetActiveIdentity)

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

    const home = `${SDO_HOME}`;
    const inventoryFile = `${home}/${network}-inventory.yml`

    fileExists(`${home}/keys/${pubkey}.json`)

    runAnsiblePlaybook("set_active_key.yml", inventoryFile, pubkey)
  }
}
