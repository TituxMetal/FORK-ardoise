import { describe, expect, it } from 'vite-plus/test'
import { amountFromCents } from '../../domain/Amount.ts'
import { Reglement } from './Reglement.entity.ts'

describe('Reglement', () => {
  it('caps a Payback at the min of what the debtor owes and the creditor is owed', () => {
    expect(Reglement.plafond(-33, 66)).toBe(33)
    expect(Reglement.plafond(-66, 33)).toBe(33)
  })

  it('accepts a Payback under the cap', () => {
    const reglement = Reglement.create('groupe', 'bob', 'lea', amountFromCents(20), -33, 66)

    expect(reglement.debtorId).toBe('bob')
    expect(reglement.creditorId).toBe('lea')
    expect(reglement.amount.value).toBe(20)
  })

  it('accepts a Payback equal to the cap', () => {
    const reglement = Reglement.create('groupe', 'bob', 'lea', amountFromCents(33), -33, 66)

    expect(reglement.amount.value).toBe(33)
  })

  it('refuses a Payback above the cap', () => {
    expect(() => Reglement.create('groupe', 'bob', 'lea', amountFromCents(34), -33, 66)).toThrow(
      Reglement.ABOVE_PLAFOND
    )
  })

  it('refuses a debtor who is not negative', () => {
    expect(() => Reglement.create('groupe', 'bob', 'lea', amountFromCents(10), 0, 66)).toThrow(
      Reglement.DEBTOR_NOT_NEGATIVE
    )
    expect(() => Reglement.create('groupe', 'bob', 'lea', amountFromCents(10), 10, 66)).toThrow(
      Reglement.DEBTOR_NOT_NEGATIVE
    )
  })

  it('refuses a creditor who is not positive', () => {
    expect(() => Reglement.create('groupe', 'bob', 'lea', amountFromCents(10), -33, 0)).toThrow(
      Reglement.CREDITOR_NOT_POSITIVE
    )
    expect(() => Reglement.create('groupe', 'bob', 'lea', amountFromCents(10), -33, -10)).toThrow(
      Reglement.CREDITOR_NOT_POSITIVE
    )
  })
})
