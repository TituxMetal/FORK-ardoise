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

  it('previews a Group without joining', async () => {
    const lea = api.groups(testUsers.lea)

    const group = await lea.create('Potes de Bob')

    await expect(lea.preview(group.invite.secret)).resolves.toEqual({
      name: 'Potes de Bob',
      memberCount: 1
    })
  })

  it('throws the API message when previewing an unknown Invite', async () => {
    await expect(api.groups(testUsers.lea).preview('nope')).rejects.toThrow(
      'Invitation introuvable'
    )
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

  it('renames a Group and returns the summary', async () => {
    const lea = api.groups(testUsers.lea)

    const group = await lea.create('Potes de Bob')
    const renamed = await lea.rename(group.id, 'Soirée de Bob')

    expect(renamed).toEqual({ id: group.id, name: 'Soirée de Bob' })
    expect(await lea.list()).toEqual([{ id: group.id, name: 'Soirée de Bob' }])
  })

  it('throws the API message when renaming a Group the User does not sit in', async () => {
    const lea = api.groups(testUsers.lea)
    const bob = api.groups(testUsers.bob)

    const group = await lea.create('Potes de Bob')

    await expect(bob.rename(group.id, 'Soirée')).rejects.toThrow('Groupe introuvable')
  })

  it('leaving a Group with other Members removes only the seat', async () => {
    const lea = api.groups(testUsers.lea)
    const bob = api.groups(testUsers.bob)

    const group = await lea.create('Potes de Bob')
    await bob.join(group.invite.secret)

    await lea.leave(group.id)

    expect(await lea.list()).toEqual([])
    expect(await bob.list()).toEqual([{ id: group.id, name: 'Potes de Bob' }])
  })

  it('leaving a Group as the last Member deletes it', async () => {
    const lea = api.groups(testUsers.lea)

    const group = await lea.create('Potes de Bob')
    await lea.leave(group.id)

    expect(await lea.list()).toEqual([])
    await expect(lea.get(group.id)).rejects.toThrow('Groupe introuvable')
  })

  it('throws the API message when leaving a Group the User does not sit in', async () => {
    const lea = api.groups(testUsers.lea)
    const bob = api.groups(testUsers.bob)

    const group = await lea.create('Potes de Bob')

    await expect(bob.leave(group.id)).rejects.toThrow('Groupe introuvable')
  })
})
