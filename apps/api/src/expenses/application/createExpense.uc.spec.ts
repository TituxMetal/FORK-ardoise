import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from '~/groups/application/group.dto'
import type { Expense } from '~/expenses/domain/expense.entity'
import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { LABEL_REQUIRED } from '~/expenses/domain/label.vo'
import { PARTICIPANTS_REQUIRED } from '~/shared/domain'
import { createExpense } from './createExpense.uc'

const members = [
  { userId: 'u1', name: 'Léa' },
  { userId: 'u2', name: 'Bob' }
]

const slate = (): GroupDto => ({
  id: 'g1',
  name: 'Potes de Bob',
  selfMemberId: 'u1',
  members,
  invite: { secret: 'secret' },
  expenses: [],
  services: [],
  paybacks: [],
  balances: members.map(member => ({ ...member, amount: 0 }))
})

const repository = (saved: Expense[] = []): ExpenseRepository => ({
  save: async expense => {
    saved.push(expense)
  },
  findById: async () => null,
  findByGroupId: async () => [],
  delete: async () => undefined
})

const view = (calls: string[]) => ({
  execute: async (userId: string, groupId: string) => {
    calls.push(`${userId}:${groupId}`)
    return slate()
  }
})

describe('createExpense', () => {
  it('saves the Expense and returns the fresh slate', async () => {
    const saved: Expense[] = []
    const calls: string[] = []
    const expenses = createExpense(repository(saved), view(calls))

    const result = await expenses.execute('u1', 'g1', {
      label: '  Pizza  ',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1',
      participantIds: ['u1', 'u2']
    })

    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      groupId: 'g1',
      label: { value: 'Pizza' },
      day: { value: '2026-08-15' },
      amount: { value: 100 },
      payerId: 'u1',
      participantIds: ['u1', 'u2']
    })
    expect(saved[0]?.parts.map(part => part.amount.value)).toEqual([50, 50])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slate())
  })

  it('defaults omitted Participants to every Member', async () => {
    const saved: Expense[] = []
    const expenses = createExpense(repository(saved), view([]))

    await expenses.execute('u1', 'g1', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1'
    })

    expect(saved[0]?.participantIds).toEqual(['u1', 'u2'])
  })

  it('refuses a Payer who is not a Member', async () => {
    const saved: Expense[] = []
    const expenses = createExpense(repository(saved), view([]))

    const create = expenses.execute('u1', 'g1', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u9'
    })

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: 'Membre introuvable'
    })
    expect(saved).toEqual([])
  })

  it('refuses an empty Participant list', async () => {
    const saved: Expense[] = []
    const expenses = createExpense(repository(saved), view([]))

    const create = expenses.execute('u1', 'g1', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1',
      participantIds: []
    })

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: PARTICIPANTS_REQUIRED
    })
    expect(saved).toEqual([])
  })

  it('refuses a blank label', async () => {
    const saved: Expense[] = []
    const expenses = createExpense(repository(saved), view([]))

    const create = expenses.execute('u1', 'g1', {
      label: '   ',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1'
    })

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: LABEL_REQUIRED
    })
    expect(saved).toEqual([])
  })
})
