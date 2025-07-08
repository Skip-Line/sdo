import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('validator:set-unstaked', () => {
  it('runs validator:set-unstaked cmd', async () => {
    const {stdout} = await runCommand('validator:set-unstaked')
    expect(stdout).to.contain('hello world')
  })

  it('runs validator:set-unstaked --name oclif', async () => {
    const {stdout} = await runCommand('validator:set-unstaked --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
