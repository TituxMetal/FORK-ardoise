import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})
afterEach(async () => {
  await api.close()
})

const openGroupWithBalances = async () => {
  const groups = api.groups(testUsers.lea)
  const group = await groups.create('Potes de Bob')
  await api.groups(testUsers.bob).join(group.invite.secret)
  await api.groups(testUsers.camille).join(group.invite.secret)
  const joined = await groups.get(group.id)
  await api.expenses(testUsers.lea).create(joined.id, {
    label: 'Pizza',
    day: '2026-08-15',
    amount: 300,
    payerId: 'lea',
    participantIds: ['lea', 'bob', 'camille']
  })
  return joined
}

describe('paybacksClient', () => {
  it('creates a Payback and returns the updated Group', async () => {
    const group = await openGroupWithBalances()

    const updated = await api.paybacks(testUsers.lea).create(group.id, {
      debtorId: 'bob',
      creditorId: 'lea',
      amount: 20
    })

    expect(updated.paybacks).toEqual([
      expect.objectContaining({ debtorId: 'bob', creditorId: 'lea', amount: 20 })
    ])
  })

  it('deletes a Payback and returns the updated Group', async () => {
    const group = await openGroupWithBalances()
    const paybacks = api.paybacks(testUsers.lea)
    const withPayback = await paybacks.create(group.id, {
      debtorId: 'bob',
      creditorId: 'lea',
      amount: 20
    })

    const updated = await paybacks.delete(withPayback.id, withPayback.paybacks[0].id)

    expect(updated.paybacks).toEqual([])
  })
  it('edits a Payback and returns the updated Group', async () => {
    const group = await openGroupWithBalances()
    const paybacks = api.paybacks(testUsers.lea)
    const withPayback = await paybacks.create(group.id, {
      debtorId: 'bob',
      creditorId: 'lea',
      amount: 20
    })

    const updated = await paybacks.update(withPayback.id, withPayback.paybacks[0].id, {
      debtorId: 'bob',
      creditorId: 'lea',
      amount: 30
    })

    expect(updated.paybacks).toEqual([
      expect.objectContaining({ debtorId: 'bob', creditorId: 'lea', amount: 30 })
    ])
  })

  it('throws the API message when a Member is unknown', async () => {
    const group = await openGroupWithBalances()

    await expect(
      api.paybacks(testUsers.lea).create(group.id, {
        debtorId: 'nobody',
        creditorId: 'lea',
        amount: 20
      })
    ).rejects.toThrow('Membre introuvable')
  })

  it('throws the API message when the Payback is missing', async () => {
    const group = await openGroupWithBalances()

    await expect(api.paybacks(testUsers.lea).delete(group.id, 'missing')).rejects.toThrow(
      'Règlement introuvable'
    )
  })
})
