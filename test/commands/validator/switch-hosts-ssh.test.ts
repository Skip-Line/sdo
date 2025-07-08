import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('validator:switch-hosts-ssh', () => {
  it('runs validator:switch-hosts-ssh cmd', async () => {
    const {stdout} = await runCommand('validator:switch-hosts-ssh')
    expect(stdout).to.contain('hello world')
  })

  it('runs validator:switch-hosts-ssh --name oclif', async () => {
    const {stdout} = await runCommand('validator:switch-hosts-ssh --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
