import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('validator:generate-vote-account', () => {
  it('runs validator:generate-vote-account cmd', async () => {
    const {stdout} = await runCommand('validator:generate-vote-account')
    expect(stdout).to.contain('hello world')
  })

  it('runs validator:generate-vote-account --name oclif', async () => {
    const {stdout} = await runCommand('validator:generate-vote-account --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
