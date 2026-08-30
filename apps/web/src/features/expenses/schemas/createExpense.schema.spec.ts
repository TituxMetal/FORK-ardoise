import { describe, expect, it } from 'vite-plus/test'
import { createExpenseSchema } from './createExpense.schema'

describe('createExpenseSchema', () => {
  it('accepts a valid Expense input', () => {
    const input = {
      label: 'Pizza',
      day: '2026-08-15',
      amount: '10',
      payerId: 'lea',
      participantIds: ['lea', 'bob']
    }

    expect(createExpenseSchema.parse(input)).toEqual(input)
  })

  it('accepts a French decimal Amount', () => {
    expect(
      createExpenseSchema.parse({
        label: 'Pizza',
        day: '2026-08-15',
        amount: '10,50',
        payerId: 'lea',
        participantIds: ['lea']
      }).amount
    ).toBe('10,50')
  })

  it('trims the label and the day', () => {
    expect(
      createExpenseSchema.parse({
        label: '  Pizza  ',
        day: ' 2026-08-15 ',
        amount: '10',
        payerId: 'lea',
        participantIds: ['lea']
      })
    ).toEqual({
      label: 'Pizza',
      day: '2026-08-15',
      amount: '10',
      payerId: 'lea',
      participantIds: ['lea']
    })
  })

  it('rejects an empty participant list with a French message', () => {
    const result = createExpenseSchema.safeParse({
      label: 'Pizza',
      day: '2026-08-15',
      amount: '10',
      payerId: 'lea',
      participantIds: []
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Au moins un participant requis')
  })

  it('rejects a blank label with a French message', () => {
    const result = createExpenseSchema.safeParse({
      label: '   ',
      day: '2026-08-15',
      amount: '10',
      payerId: 'lea',
      participantIds: ['lea']
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Libellé requis')
  })

  it('rejects a malformed day with a French message', () => {
    const result = createExpenseSchema.safeParse({
      label: 'Pizza',
      day: '15/08/2026',
      amount: '10',
      payerId: 'lea',
      participantIds: ['lea']
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Jour requis')
  })

  it('rejects a non-positive Amount with a French message', () => {
    const result = createExpenseSchema.safeParse({
      label: 'Pizza',
      day: '2026-08-15',
      amount: '0',
      payerId: 'lea',
      participantIds: ['lea']
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Montant > 0 requis')
  })
})
