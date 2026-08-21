import { describe, expect, it } from 'vite-plus/test'
import { AMOUNT_INTEGER, AMOUNT_POSITIVE, amountFromCents, amountFromEuros } from './amount.vo'

describe('Amount', () => {
  it('keeps an integer number of cents from cents', () => {
    const amount = amountFromCents(100)

    expect(amount.value).toBe(100)
  })

  it('converts euros to integer cents', () => {
    const amount = amountFromEuros(12.5)

    expect(amount.value).toBe(1250)
  })

  it('rejects a non-integer number of cents', () => {
    const amount = () => amountFromCents(1.5)

    expect(amount).toThrow(AMOUNT_INTEGER)
  })

  it('rejects zero and below', () => {
    const zero = () => amountFromCents(0)
    const negative = () => amountFromCents(-1)

    expect(zero).toThrow(AMOUNT_POSITIVE)
    expect(negative).toThrow(AMOUNT_POSITIVE)
  })

  it('rejects euros that are not an exact cent', () => {
    const amount = () => amountFromEuros(1.001)

    expect(amount).toThrow(AMOUNT_INTEGER)
  })

  it('treats amounts with the same cents as equal', () => {
    const amount = amountFromCents(100)
    const different = amountFromCents(101)

    expect(amount).toEqual({ value: 100 })
    expect(amount).not.toEqual(different)
  })
})
