import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('validator:switch-hosts-p2p', () => {
  it('runs validator:switch-hosts-p2p cmd', async () => {
    const {stdout} = await runCommand('validator:switch-hosts-p2p')
    expect(stdout).to.contain('hello world')
  })

  it('runs validator:switch-hosts-p2p --name oclif', async () => {
    const {stdout} = await runCommand('validator:switch-hosts-p2p --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
