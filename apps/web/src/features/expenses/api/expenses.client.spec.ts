import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})
afterEach(async () => {
  await api.close()
})

const pizza = {
  label: 'Pizza',
  day: '2026-08-15',
  amount: 100,
  payerId: 'lea',
  participantIds: ['lea']
}

describe('expensesClient', () => {
  it('creates an Expense and returns the updated Group', async () => {
    const groups = api.groups(testUsers.lea)
    const group = await groups.create('Potes de Bob')

    const updated = await api.expenses(testUsers.lea).create(group.id, pizza)

    expect(updated.expenses).toEqual([expect.objectContaining(pizza)])
  })

  it('deletes an Expense and returns the updated Group', async () => {
    const groups = api.groups(testUsers.lea)
    const expenses = api.expenses(testUsers.lea)
    const group = await groups.create('Potes de Bob')
    const withExpense = await expenses.create(group.id, pizza)

    const updated = await expenses.delete(withExpense.id, withExpense.expenses[0].id)

    expect(updated.expenses).toEqual([])
  })
  it('edits an Expense and returns the updated Group', async () => {
    const groups = api.groups(testUsers.lea)
    const expenses = api.expenses(testUsers.lea)
    const group = await groups.create('Potes de Bob')
    const withExpense = await expenses.create(group.id, pizza)

    const updated = await expenses.update(withExpense.id, withExpense.expenses[0].id, {
      label: 'Pizza géante',
      day: '2026-08-16',
      amount: 200,
      payerId: 'lea',
      participantIds: ['lea']
    })

    expect(updated.expenses).toEqual([
      expect.objectContaining({ label: 'Pizza géante', day: '2026-08-16', amount: 200 })
    ])
  })

  it('throws the API message when a Member is unknown', async () => {
    const groups = api.groups(testUsers.lea)
    const group = await groups.create('Potes de Bob')

    await expect(
      api.expenses(testUsers.lea).create(group.id, { ...pizza, payerId: 'nobody' })
    ).rejects.toThrow('Membre introuvable')
  })

  it('throws the API message when the Expense is missing', async () => {
    const groups = api.groups(testUsers.lea)
    const group = await groups.create('Potes de Bob')

    await expect(api.expenses(testUsers.lea).delete(group.id, 'missing')).rejects.toThrow(
      'Dépense introuvable'
    )
  })
})
