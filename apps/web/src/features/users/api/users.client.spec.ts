import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})
afterEach(async () => {
  await api.close()
})

describe('usersClient', () => {
  it('renames the User and returns the saved name', async () => {
    const users = api.users(testUsers.lea)

    const result = await users.rename('  Léa P.  ')

    expect(result).toEqual({ name: 'Léa P.' })
  })

  it('propagates the renamed seat to every Group of the User', async () => {
    const lea = api.groups(testUsers.lea)
    const group = await lea.create('Potes de Bob')

    await api.users(testUsers.lea).rename('Léa P.')

    const updated = await lea.get(group.id)
    expect(updated.members).toEqual([{ userId: 'lea', name: 'Léa P.' }])
  })

  it('throws the API message when the name is blank', async () => {
    await expect(api.users(testUsers.lea).rename('   ')).rejects.toThrow('Nom requis')
  })
})
