import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from '~/groups/application/group.dto'
import { amountReconstitute } from '~/shared/domain'
import { dayReconstitute } from '~/expenses/domain/day.vo'
import { expenseReconstitute, type Expense } from '~/expenses/domain/expense.entity'
import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { labelReconstitute } from '~/expenses/domain/label.vo'
import { deleteExpense } from './deleteExpense.uc'

const pizza = (groupId = 'g1'): Expense =>
  expenseReconstitute(
    'e1',
    groupId,
    labelReconstitute('Pizza'),
    dayReconstitute('2026-08-15'),
    amountReconstitute(100),
    'u1',
    ['u1'],
    [{ userId: 'u1', amount: amountReconstitute(100) }]
  )

const slate = (): GroupDto => ({
  id: 'g1',
  name: 'Potes de Bob',
  selfMemberId: 'u1',
  members: [{ userId: 'u1', name: 'Léa' }],
  invite: { secret: 'secret' },
  expenses: [],
  services: [],
  paybacks: [],
  balances: [{ userId: 'u1', name: 'Léa', amount: 0 }]
})

const repository = (deleted: string[], found: Expense | null): ExpenseRepository => ({
  save: async () => undefined,
  findById: async () => found,
  findByGroupId: async () => [],
  delete: async id => {
    deleted.push(id)
  }
})

describe('deleteExpense', () => {
  it('deletes the Expense and returns the fresh slate', async () => {
    const deleted: string[] = []
    const calls: string[] = []
    const expenses = deleteExpense(repository(deleted, pizza()), {
      execute: async (userId, groupId) => {
        calls.push(`${userId}:${groupId}`)
        return slate()
      }
    })

    const result = await expenses.execute('u1', 'g1', 'e1')

    expect(deleted).toEqual(['e1'])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slate())
  })

  it('refuses an unknown Expense without deleting', async () => {
    const deleted: string[] = []
    const expenses = deleteExpense(repository(deleted, null), { execute: async () => slate() })

    const remove = expenses.execute('u1', 'g1', 'inconnu')

    await expect(remove).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Dépense introuvable'
    })
    expect(deleted).toEqual([])
  })

  it('refuses an Expense of another Group without deleting', async () => {
    const deleted: string[] = []
    const expenses = deleteExpense(repository(deleted, pizza('g2')), {
      execute: async () => slate()
    })

    const remove = expenses.execute('u1', 'g1', 'e1')

    await expect(remove).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Dépense introuvable'
    })
    expect(deleted).toEqual([])
  })
})
