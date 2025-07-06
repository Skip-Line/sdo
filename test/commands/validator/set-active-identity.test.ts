import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('validator:set-active-identity', () => {
  it('runs validator:set-active-identity cmd', async () => {
    const {stdout} = await runCommand('validator:set-active-identity')
    expect(stdout).to.contain('hello world')
  })

  it('runs validator:set-active-identity --name oclif', async () => {
    const {stdout} = await runCommand('validator:set-active-identity --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
