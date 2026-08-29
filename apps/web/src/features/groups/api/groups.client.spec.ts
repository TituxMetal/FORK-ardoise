import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})
afterEach(async () => {
  await api.close()
})

describe('groupsClient', () => {
  it('throws the API message when the Group is missing', async () => {
    await expect(api.groups(testUsers.lea).get('missing')).rejects.toThrow('Groupe introuvable')
  })

  it('throws the API message when the Invite is missing', async () => {
    await expect(api.groups(testUsers.lea).join('nope')).rejects.toThrow('Invitation introuvable')
  })

  it('creates, lists and fetches a Group', async () => {
    const lea = api.groups(testUsers.lea)

    const group = await lea.create('Potes de Bob')

    expect(await lea.list()).toEqual([{ id: group.id, name: 'Potes de Bob' }])
    expect(await lea.get(group.id)).toEqual(group)
  })

  it('adds the joining User as a Member', async () => {
    const lea = api.groups(testUsers.lea)
    const bob = api.groups(testUsers.bob)

    const group = await lea.create('Potes de Bob')
    await bob.join(group.invite.secret)

    const joined = await lea.get(group.id)
    expect(joined.members.map(member => member.name)).toEqual(['Léa', 'Bob'])
  })
})
