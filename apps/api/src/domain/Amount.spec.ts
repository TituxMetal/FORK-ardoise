import { describe, expect, it } from 'vite-plus/test'
import { AMOUNT_INTEGER, AMOUNT_POSITIVE, amountFromCents, amountFromEuros } from '~/domain/Amount'

describe('Amount', () => {
  it('keeps an integer number of cents from cents', () => {
    expect(amountFromCents(100).value).toBe(100)
  })

  it('converts euros to integer cents', () => {
    expect(amountFromEuros(12.5).value).toBe(1250)
  })

  it('rejects a non-integer number of cents', () => {
    expect(() => amountFromCents(1.5)).toThrow(AMOUNT_INTEGER)
  })

  it('rejects zero and below', () => {
    expect(() => amountFromCents(0)).toThrow(AMOUNT_POSITIVE)
    expect(() => amountFromCents(-1)).toThrow(AMOUNT_POSITIVE)
  })

  it('rejects euros that are not an exact cent', () => {
    expect(() => amountFromEuros(1.001)).toThrow(AMOUNT_INTEGER)
  })

  it('treats amounts with the same cents as equal', () => {
    expect(amountFromCents(100)).toEqual({ value: 100 })
    expect(amountFromCents(100)).not.toEqual(amountFromCents(101))
  })
})
