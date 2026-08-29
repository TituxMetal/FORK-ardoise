import { describe, expect, it } from 'vite-plus/test'
import { createTestApi, testUsers } from '~/lib/testApi'

describe('createTestApi', () => {
  it('serves the API in-process with one User per client', async () => {
    const { client } = await createTestApi()
    const lea = client(testUsers.lea)

    const group = await lea.create('Potes de Bob')

    expect(await lea.list()).toEqual([{ id: group.id, name: 'Potes de Bob' }])
  })

  it('keeps Users isolated: a Group is only listed by its Members', async () => {
    const { client } = await createTestApi()
    const lea = client(testUsers.lea)
    const bob = client(testUsers.bob)

    const group = await lea.create('Potes de Bob')

    expect(await bob.list()).toEqual([])
    expect((await lea.get(group.id)).members).toEqual([{ userId: 'lea', name: 'Léa' }])
  })
})
