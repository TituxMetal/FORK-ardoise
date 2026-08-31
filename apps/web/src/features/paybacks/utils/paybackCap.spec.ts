import { describe, expect, it } from 'vite-plus/test'
import { paybackCap, paybackCreditors } from './paybackCap'

const balances = [
  { userId: 'alice', name: 'Alice', amount: 5000 },
  { userId: 'bob', name: 'Bob', amount: -3000 },
  { userId: 'carol', name: 'Carol', amount: 1200 }
]

describe('paybackCreditors', () => {
  it('lists the positive Balances most-owed first on create', () => {
    expect(paybackCreditors(balances, null)).toEqual([
      { userId: 'alice', name: 'Alice', amount: 5000 },
      { userId: 'carol', name: 'Carol', amount: 1200 }
    ])
  })

  it('re-derives the Balances without the edited Payback', () => {
    expect(
      paybackCreditors(balances, { debtorId: 'bob', creditorId: 'alice', amount: 1000 })
    ).toEqual([
      { userId: 'alice', name: 'Alice', amount: 6000 },
      { userId: 'carol', name: 'Carol', amount: 1200 }
    ])
  })
})

describe('paybackCap', () => {
  it('bounds a create by the Balances it cancels', () => {
    expect(paybackCap(balances, null, 'bob', 'alice')).toBe(3000)
    expect(paybackCap(balances, null, 'bob', 'carol')).toBe(1200)
  })

  it('frees headroom for a Payback already at the raw cap', () => {
    const atCap = { debtorId: 'bob', creditorId: 'alice', amount: 3000 }
    expect(paybackCap(balances, atCap, 'bob', 'alice')).toBe(6000)
  })

  it('leaves no headroom when the debtor owes nothing', () => {
    expect(
      paybackCap([...balances, { userId: 'dave', name: 'Dave', amount: 0 }], null, 'dave', 'alice')
    ).toBe(0)
  })
})
