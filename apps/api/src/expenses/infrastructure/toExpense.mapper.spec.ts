import { describe, expect, it } from 'vite-plus/test'
import { toExpense } from './toExpense.mapper'

const row = {
  id: 'e1',
  groupId: 'g1',
  label: 'Pizza',
  day: '2026-08-15',
  amount: 100,
  payerId: 'u-lea',
  participants: [
    { userId: 'u-camille', ordinal: 2 },
    { userId: 'u-lea', ordinal: 0 },
    { userId: 'u-bob', ordinal: 1 }
  ],
  parts: [
    { userId: 'u-camille', amount: 33, ordinal: 2 },
    { userId: 'u-lea', amount: 34, ordinal: 0 },
    { userId: 'u-bob', amount: 33, ordinal: 1 }
  ]
}

describe('toExpense', () => {
  it('maps a row to an Expense entity in ordinal order', () => {
    const expense = toExpense(row)

    expect(expense).toEqual({
      id: 'e1',
      groupId: 'g1',
      label: { value: 'Pizza' },
      day: { value: '2026-08-15' },
      amount: { value: 100 },
      payerId: 'u-lea',
      participantIds: ['u-lea', 'u-bob', 'u-camille'],
      parts: [
        { userId: 'u-lea', amount: { value: 34 } },
        { userId: 'u-bob', amount: { value: 33 } },
        { userId: 'u-camille', amount: { value: 33 } }
      ]
    })
  })

  it('maps an Expense without Participants or Parts', () => {
    const expense = toExpense({ ...row, participants: [], parts: [] })

    expect(expense.participantIds).toEqual([])
    expect(expense.parts).toEqual([])
  })
})
