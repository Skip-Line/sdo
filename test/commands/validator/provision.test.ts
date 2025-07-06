import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('validator:provision', () => {
  it('runs validator:provision cmd', async () => {
    const {stdout} = await runCommand('validator:provision')
    expect(stdout).to.contain('hello world')
  })

  it('runs validator:provision --name oclif', async () => {
    const {stdout} = await runCommand('validator:provision --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
