import { describe, expect, it } from 'vite-plus/test'
import { createPaybackSchema } from './createPayback.schema'

describe('createPaybackSchema', () => {
  it('accepts a valid Payback input', () => {
    const input = { debtorId: 'bob', creditorId: 'lea', amount: '0,20' }

    expect(createPaybackSchema.parse(input)).toEqual(input)
  })

  it('accepts a whole euro Amount', () => {
    expect(
      createPaybackSchema.parse({ debtorId: 'bob', creditorId: 'lea', amount: '5' }).amount
    ).toBe('5')
  })

  it('rejects a non-positive Amount with a French message', () => {
    const result = createPaybackSchema.safeParse({
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
      debtorId: 'bob',
      creditorId: 'lea',
      amount: 'abc'
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Montant invalide')
  })
})
