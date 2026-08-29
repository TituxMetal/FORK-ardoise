import { describe, expect, it } from 'vite-plus/test'
import { centsFromEuros, euros } from './amounts'

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
