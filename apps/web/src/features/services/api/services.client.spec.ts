import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})
afterEach(async () => {
  await api.close()
})

const laptop = {
  label: 'Ordi Bob',
  day: '2026-08-15',
  amount: 100,
  providerId: 'lea',
  participantIds: ['lea']
}

describe('servicesClient', () => {
  it('creates a Service and returns the updated Group', async () => {
    const groups = api.groups(testUsers.lea)
    const group = await groups.create('Potes de Bob')

    const updated = await api.services(testUsers.lea).create(group.id, laptop)

    expect(updated.services).toEqual([expect.objectContaining(laptop)])
  })

  it('deletes a Service and returns the updated Group', async () => {
    const groups = api.groups(testUsers.lea)
    const services = api.services(testUsers.lea)
    const group = await groups.create('Potes de Bob')
    const withService = await services.create(group.id, laptop)

    const updated = await services.delete(withService.id, withService.services[0].id)

    expect(updated.services).toEqual([])
  })

  it('throws the API message when a Member is unknown', async () => {
    const groups = api.groups(testUsers.lea)
    const group = await groups.create('Potes de Bob')

    await expect(
      api.services(testUsers.lea).create(group.id, { ...laptop, providerId: 'nobody' })
    ).rejects.toThrow('Membre introuvable')
  })

  it('throws the API message when the Service is missing', async () => {
    const groups = api.groups(testUsers.lea)
    const group = await groups.create('Potes de Bob')

    await expect(api.services(testUsers.lea).delete(group.id, 'missing')).rejects.toThrow(
      'Service introuvable'
    )
  })
})
