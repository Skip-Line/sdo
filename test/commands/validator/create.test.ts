import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('validator:create', () => {
  it('runs validator:create cmd', async () => {
    const {stdout} = await runCommand('validator:create')
    expect(stdout).to.contain('hello world')
  })

  it('runs validator:create --name oclif', async () => {
    const {stdout} = await runCommand('validator:create --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
