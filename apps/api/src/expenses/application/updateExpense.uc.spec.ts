import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from '~/groups/application/group.dto'
import { amountReconstitute, dayReconstitute } from '~/shared/domain'
import { expenseReconstitute, type Expense } from '~/expenses/domain/expense.entity'
import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { labelReconstitute } from '~/expenses/domain/label.vo'
import { updateExpense } from './updateExpense.uc'

const pizza = (groupId = 'g1'): Expense =>
  expenseReconstitute(
    'e1',
    groupId,
    labelReconstitute('Pizza'),
    dayReconstitute('2026-08-15'),
    amountReconstitute(100),
    'u1',
    ['u1', 'u2'],
    [
      { userId: 'u1', amount: amountReconstitute(50) },
      { userId: 'u2', amount: amountReconstitute(50) }
    ]
  )

const slate = (): GroupDto => ({
  id: 'g1',
  name: 'Potes de Bob',
  selfMemberId: 'u1',
  members: [
    { userId: 'u1', name: 'Léa' },
    { userId: 'u2', name: 'Bob' }
  ],
  invite: { secret: 'secret' },
  expenses: [],
  services: [],
  paybacks: [],
  balances: [
    { userId: 'u1', name: 'Léa', amount: 0 },
    { userId: 'u2', name: 'Bob', amount: 0 }
  ]
})

const repository = (updated: Expense[], found: Expense | null): ExpenseRepository => ({
  save: async () => undefined,
  findById: async () => found,
  findByGroupId: async () => [],
  update: async expense => {
    updated.push(expense)
  },
  delete: async () => undefined
})

describe('updateExpense', () => {
  it('updates the Expense keeping the id and returns the fresh slate', async () => {
    const updated: Expense[] = []
    const calls: string[] = []
    const expenses = updateExpense(repository(updated, pizza()), {
      execute: async (userId, groupId) => {
        calls.push(`${userId}:${groupId}`)
        return slate()
      }
    })

    const result = await expenses.execute('u1', 'g1', 'e1', {
      label: 'Pizza plus',
      day: '2026-08-16',
      amount: 200,
      payerId: 'u2',
      participantIds: ['u1', 'u2']
    })

    expect(updated).toHaveLength(1)
    expect(updated[0]).toMatchObject({
      id: 'e1',
      groupId: 'g1',
      label: { value: 'Pizza plus' },
      day: { value: '2026-08-16' },
      amount: { value: 200 },
      payerId: 'u2',
      participantIds: ['u1', 'u2']
    })
    expect(updated[0]?.parts.map(part => part.amount.value)).toEqual([100, 100])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slate())
  })

  it('keeps the existing Participants when the list is omitted', async () => {
    const updated: Expense[] = []
    const expenses = updateExpense(repository(updated, pizza()), { execute: async () => slate() })

    await expenses.execute('u1', 'g1', 'e1', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1'
    })

    expect(updated[0]?.participantIds).toEqual(['u1', 'u2'])
  })

  it('refuses an unknown Expense without updating', async () => {
    const updated: Expense[] = []
    const expenses = updateExpense(repository(updated, null), { execute: async () => slate() })

    const edit = expenses.execute('u1', 'g1', 'inconnu', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1'
    })

    await expect(edit).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Dépense introuvable'
    })
    expect(updated).toEqual([])
  })

  it('refuses an Expense of another Group without updating', async () => {
    const updated: Expense[] = []
    const expenses = updateExpense(repository(updated, pizza('g2')), {
      execute: async () => slate()
    })

    const edit = expenses.execute('u1', 'g1', 'e1', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1'
    })

    await expect(edit).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Dépense introuvable'
    })
    expect(updated).toEqual([])
  })

  it('refuses a Payer who is not a Member without updating', async () => {
    const updated: Expense[] = []
    const expenses = updateExpense(repository(updated, pizza()), { execute: async () => slate() })

    const edit = expenses.execute('u1', 'g1', 'e1', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u9'
    })

    await expect(edit).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: 'Membre introuvable'
    })
    expect(updated).toEqual([])
  })
})
