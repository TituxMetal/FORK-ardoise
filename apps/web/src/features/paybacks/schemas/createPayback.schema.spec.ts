import { describe, expect, it } from 'vite-plus/test'
import { createPaybackSchema, paybackFieldsSchema } from './createPayback.schema'

describe('paybackFieldsSchema', () => {
  it('accepts a valid Payback input', () => {
    const input = { day: '2026-08-31', debtorId: 'bob', creditorId: 'lea', amount: '0,20' }

    expect(paybackFieldsSchema.parse(input)).toEqual(input)
  })

  it('accepts a whole euro Amount', () => {
    expect(
      paybackFieldsSchema.parse({
        day: '2026-08-31',
        debtorId: 'bob',
        creditorId: 'lea',
        amount: '5'
      }).amount
    ).toBe('5')
  })

  it('trims the day', () => {
    expect(
      paybackFieldsSchema.parse({
        day: ' 2026-08-31 ',
        debtorId: 'bob',
        creditorId: 'lea',
        amount: '0,20'
      }).day
    ).toBe('2026-08-31')
  })

  it('rejects a non-positive Amount with a French message', () => {
    const result = paybackFieldsSchema.safeParse({
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
    const result = paybackFieldsSchema.safeParse({
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
    const result = paybackFieldsSchema.safeParse({
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

describe('createPaybackSchema', () => {
  const input = { day: '2026-08-31', debtorId: 'bob', creditorId: 'alice' }

  it('accepts an Amount one cent below the cap', () => {
    expect(createPaybackSchema(2000).safeParse({ ...input, amount: '19,99' }).success).toBe(true)
  })

  it('accepts an Amount exactly at the cap', () => {
    expect(createPaybackSchema(2000).safeParse({ ...input, amount: '20' }).success).toBe(true)
  })

  it('rejects an Amount one cent above the cap with the server French message', () => {
    const result = createPaybackSchema(2000).safeParse({ ...input, amount: '20,01' })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Montant au-dessus du plafond')
  })

  it('rejects an Amount a lowered selection cap makes over the limit', () => {
    // The same Amount clears the wider pair's 30,00 € cap but not the
    // narrower pair's 12,00 € one: the cap is the selection's headroom.
    const wide = createPaybackSchema(3000).safeParse({ ...input, amount: '20' })
    const narrowed = createPaybackSchema(1200).safeParse({ ...input, amount: '20' })

    expect(wide.success).toBe(true)
    expect(narrowed.success).toBe(false)
    if (narrowed.success) return

    expect(narrowed.error.issues[0]?.message).toBe('Montant au-dessus du plafond')
  })
})
