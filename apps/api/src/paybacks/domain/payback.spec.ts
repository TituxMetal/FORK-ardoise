import { describe, expect, it } from 'vite-plus/test'
import { amountFromCents } from '~/shared/domain'
import {
  PAYBACK_ABOVE_CAP,
  PAYBACK_CREDITOR_NOT_POSITIVE,
  PAYBACK_DEBTOR_NOT_NEGATIVE,
  paybackCap,
  paybackCreate
} from '~/paybacks/domain/payback.entity'

describe('Payback', () => {
  it('caps a Payback at the min of what the debtor owes and the creditor is owed', () => {
    expect(paybackCap(-33, 66)).toBe(33)
    expect(paybackCap(-66, 33)).toBe(33)
  })

  it('accepts a Payback under the cap', () => {
    const payback = paybackCreate('group', 'bob', 'lea', amountFromCents(20), -33, 66)

    expect(payback.debtorId).toBe('bob')
    expect(payback.creditorId).toBe('lea')
    expect(payback.amount.value).toBe(20)
  })

  it('accepts a Payback equal to the cap', () => {
    const payback = paybackCreate('group', 'bob', 'lea', amountFromCents(33), -33, 66)

    expect(payback.amount.value).toBe(33)
  })

  it('refuses a Payback above the cap', () => {
    expect(() => paybackCreate('group', 'bob', 'lea', amountFromCents(34), -33, 66)).toThrow(
      PAYBACK_ABOVE_CAP
    )
  })

  it('refuses a debtor who is not negative', () => {
    expect(() => paybackCreate('group', 'bob', 'lea', amountFromCents(10), 0, 66)).toThrow(
      PAYBACK_DEBTOR_NOT_NEGATIVE
    )
    expect(() => paybackCreate('group', 'bob', 'lea', amountFromCents(10), 10, 66)).toThrow(
      PAYBACK_DEBTOR_NOT_NEGATIVE
    )
  })

  it('refuses a creditor who is not positive', () => {
    expect(() => paybackCreate('group', 'bob', 'lea', amountFromCents(10), -33, 0)).toThrow(
      PAYBACK_CREDITOR_NOT_POSITIVE
    )
    expect(() => paybackCreate('group', 'bob', 'lea', amountFromCents(10), -33, -10)).toThrow(
      PAYBACK_CREDITOR_NOT_POSITIVE
    )
  })
})
