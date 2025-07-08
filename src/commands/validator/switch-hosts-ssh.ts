import { input, select } from '@inquirer/prompts'
import { Args, Command, Flags } from '@oclif/core'
import { exec } from 'child_process'
import yoctoSpinner from 'yocto-spinner'
import { SDO_HOME } from '../../lib/constants.js'
import { runAnsiblePlaybook } from '../../lib/utils.js'

export default class ValidatorSwitchHostsSsh extends Command {
  static override args = {

  }
  static override description = 'Switch active and backup validators using SSH'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    network: Flags.string({
      char: 'n',
      description: 'Network where validators are deployed',
    }),
    active: Flags.string({
      char: 'a',
      description: 'Pub key of active validator',
    }),
    backup: Flags.string({
      char: 'b',
      description: 'Pub key of hot backup validator',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(ValidatorSwitchHostsSsh)

    let network = flags.network
    if (!network) {
      network = await select({
        message: 'What is the validator network?',
        choices: ['testnet', 'mainnet'],
      })
    }

    let active = flags.active
    if (!active) {
      active = await input({
        message: 'What is the pub key of the active validator?',
      })
    }
    if (active.trim() === '') {
      this.error('Active validator pub key is required')
    }

    let backup = flags.backup
    if (!backup) {
      backup = await input({
        message: 'What is the pub key of the hot backup validator?',
      })
    }
    if (backup.trim() === '') {
      this.error('Hot backup validator pub key is required')
    }

    const spinner = yoctoSpinner()
    spinner.start('Connecting to validator via SSH...')
    try {
      exec(`ansible -i ${SDO_HOME}/${network}-inventory.yml -m ping --limit ${active},${backup}`)
      spinner.stop('SSH connection check successful')
      runAnsiblePlaybook("switch_ssh.yml", network!, `${active},${backup}`)
    } catch (error) {
      spinner.stop('Failed to connect via SSH')
      this.error(`SSH connection failed`)
    }
  }
}