import { input, select } from '@inquirer/prompts'
import { Args, Command, Flags } from '@oclif/core'
import { exec, execSync } from 'child_process'
import yoctoSpinner from 'yocto-spinner'
import { SDO_HOME } from '../../lib/constants.js'
import { runAnsiblePlaybook, runAnsiblePlaybookAgainstLocal, switchHostsDetailsInventory } from '../../lib/utils.js'
import { config } from 'chai'
import { cwd } from 'process'

export default class ValidatorSwitchHostsP2p extends Command {
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
    config: Flags.string({
      char: 'c',
      description: 'Path to the configuration file',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(ValidatorSwitchHostsP2p)

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

    let config = flags.config
    if (!config) {
      config = await input({
        message: 'What is the path to the configuration file (Empty for none)?',
      })
    }
    if (config.trim() === '') {
      config = undefined
    }
    if (config && !config.endsWith('.yml')) {
      this.error('Configuration file must be a YAML file')
    }
    if (config && !config.startsWith('/')) {
      config = cwd() + '/' + config
    }

    const spinner = yoctoSpinner()
    spinner.start('Connecting to validators via SSH...')
    try {
      execSync(`ansible -i ${SDO_HOME}/${network}-inventory.yml --limit ${active},${backup} -m ping all`)

      spinner.stop('SSH connection check successful')
      runAnsiblePlaybookAgainstLocal('gen_certs.yml', network!, active, backup, config)

    } catch (error) {
      spinner.stop('Failed to connect via SSH')
      this.error(`SSH connection failed`)
    }
  }
}