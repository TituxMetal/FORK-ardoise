import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})
afterEach(async () => {
  await api.close()
})

describe('createTestApi', () => {
  it('serves the API in-process with one User per client', async () => {
    const lea = api.client(testUsers.lea)

    const group = await lea.create('Potes de Bob')

    expect(await lea.list()).toEqual([{ id: group.id, name: 'Potes de Bob' }])
  })

  it('keeps Users isolated: a Group is only listed by its Members', async () => {
    const lea = api.client(testUsers.lea)
    const bob = api.client(testUsers.bob)

    const group = await lea.create('Potes de Bob')

    expect(await bob.list()).toEqual([])
    expect((await lea.get(group.id)).members).toEqual([{ userId: 'lea', name: 'Léa' }])
  })
})
