import { describe, expect, it } from 'vite-plus/test'
import { centsFromEuros, euros, eurosAmountSchema, signedEuros } from './amounts'

describe('euros', () => {
  it('formats cents with a comma and the euro sign', () => {
    expect(euros(1234)).toBe('12,34 €')
  })

  it('formats a negative Amount with the minus sign', () => {
    expect(euros(-1234)).toBe('−12,34 €')
  })

  it('formats zero', () => {
    expect(euros(0)).toBe('0,00 €')
  })
})

describe('signedEuros', () => {
  it('prefixes a positive Amount with a plus sign', () => {
    expect(signedEuros(3850)).toBe('+38,50 €')
  })

  it('prefixes a negative Amount with the minus sign', () => {
    expect(signedEuros(-1425)).toBe('−14,25 €')
  })

  it('leaves zero unsigned', () => {
    expect(signedEuros(0)).toBe('0,00 €')
  })
})

describe('centsFromEuros', () => {
  it('parses a comma decimal into cents', () => {
    expect(centsFromEuros('12,5')).toBe(1250)
  })

  it('parses a whole euro amount into cents', () => {
    expect(centsFromEuros('7')).toBe(700)
  })

  it('parses a negative amount into cents', () => {
    expect(centsFromEuros('-3,25')).toBe(-325)
  })
})

describe('eurosAmountSchema', () => {
  it('accepts a positive amount written with a comma or a dot', () => {
    expect(eurosAmountSchema.parse('0,20')).toBe('0,20')
    expect(eurosAmountSchema.parse('0.90')).toBe('0.90')
    expect(eurosAmountSchema.parse('12,5')).toBe('12,5')
  })

  it('rejects a non-positive amount with a French message', () => {
    const result = eurosAmountSchema.safeParse('0')

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Montant > 0 requis')
  })

  it('rejects a non-numeric amount with a French message', () => {
    const result = eurosAmountSchema.safeParse('abc')

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Montant invalide')
  })

  it('rejects an amount with more than two decimal places', () => {
    const result = eurosAmountSchema.safeParse('1.234')

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Montant invalide')
  })
})
