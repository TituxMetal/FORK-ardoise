import { describe, expect, it } from 'vite-plus/test'
import { createPaybackSchema } from './createPayback.schema'

describe('createPaybackSchema', () => {
  it('accepts a valid Payback input', () => {
    const input = { day: '2026-08-31', debtorId: 'bob', creditorId: 'lea', amount: '0,20' }

    expect(createPaybackSchema.parse(input)).toEqual(input)
  })

  it('accepts a whole euro Amount', () => {
    expect(
      createPaybackSchema.parse({
        day: '2026-08-31',
        debtorId: 'bob',
        creditorId: 'lea',
        amount: '5'
      }).amount
    ).toBe('5')
  })

  it('trims the day', () => {
    expect(
      createPaybackSchema.parse({
        day: ' 2026-08-31 ',
        debtorId: 'bob',
        creditorId: 'lea',
        amount: '0,20'
      }).day
    ).toBe('2026-08-31')
  })

  it('rejects a non-positive Amount with a French message', () => {
    const result = createPaybackSchema.safeParse({
      day: '2026-08-31',
      debtorId: 'bob',
      creditorId: 'lea',
      amount: '0'
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Montant > 0 requis')
  })

  it('rejects a non-numeric Amount with a French message', () => {
    const result = createPaybackSchema.safeParse({
      day: '2026-08-31',
      debtorId: 'bob',
      creditorId: 'lea',
      amount: 'abc'
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Montant invalide')
  })

  it('rejects a malformed day with a French message', () => {
    const result = createPaybackSchema.safeParse({
      day: '31/08/2026',
      debtorId: 'bob',
      creditorId: 'lea',
      amount: '0,20'
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Jour requis')
  })
})
