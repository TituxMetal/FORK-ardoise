import { describe, expect, it } from 'vite-plus/test'
import { amountFromCents } from '~/domain/Amount'
import { equalParts } from '~/domain/Part'
import { balancesOf } from '~/domain/Balance'

const members = [
  { userId: 'lea', name: 'Léa' },
  { userId: 'bob', name: 'Bob' },
  { userId: 'camille', name: 'Camille' }
]

describe('balancesOf', () => {
  it('credits the Payer and debits the other Participants', () => {
    const parts = equalParts(amountFromCents(100), ['lea', 'bob', 'camille'], 'lea')
    const balances = balancesOf(members, [{ payerId: 'lea', amount: 100, parts }])

    expect(balances).toEqual([
      { userId: 'lea', name: 'Léa', amount: 66 },
      { userId: 'bob', name: 'Bob', amount: -33 },
      { userId: 'camille', name: 'Camille', amount: -33 }
    ])
  })

  it('gives a Payer outside the Participants the remainder and sums to 0', () => {
    const people = [...members, { userId: 'dan', name: 'Dan' }]
    const parts = equalParts(amountFromCents(100), ['bob', 'camille', 'dan'], 'lea')
    const balances = balancesOf(people, [{ payerId: 'lea', amount: 100, parts }])

    expect(balances).toEqual([
      { userId: 'lea', name: 'Léa', amount: 99 },
      { userId: 'bob', name: 'Bob', amount: -33 },
      { userId: 'camille', name: 'Camille', amount: -33 },
      { userId: 'dan', name: 'Dan', amount: -33 }
    ])
    expect(balances.reduce((sum, balance) => sum + balance.amount, 0)).toBe(0)
  })

  it('does not let an Expense in one Group change the Balances of another', () => {
    const parts = equalParts(amountFromCents(100), ['lea', 'bob', 'camille'], 'lea')
    const friends = balancesOf(members, [{ payerId: 'lea', amount: 100, parts }])
    const coworkers = balancesOf(
      [
        { userId: 'lea', name: 'Léa' },
        { userId: 'eve', name: 'Eve' }
      ],
      []
    )

    expect(friends.find(balance => balance.userId === 'lea')?.amount).toBe(66)
    expect(coworkers).toEqual([
      { userId: 'lea', name: 'Léa', amount: 0 },
      { userId: 'eve', name: 'Eve', amount: 0 }
    ])
  })

  it('credits the Provider of a Service like the Payer of an Expense', () => {
    const parts = equalParts(amountFromCents(100), ['lea', 'bob', 'camille'], 'lea')
    const balances = balancesOf(members, [], [{ providerId: 'lea', amount: 100, parts }])

    expect(balances).toEqual([
      { userId: 'lea', name: 'Léa', amount: 66 },
      { userId: 'bob', name: 'Bob', amount: -33 },
      { userId: 'camille', name: 'Camille', amount: -33 }
    ])
  })

  it('lets an Expense and a Service in the same Group cancel out', () => {
    const pizza = equalParts(amountFromCents(100), ['lea', 'bob', 'camille'], 'lea')
    const computer = equalParts(amountFromCents(100), ['lea', 'bob', 'camille'], 'bob')
    const balances = balancesOf(
      members,
      [{ payerId: 'lea', amount: 100, parts: pizza }],
      [{ providerId: 'bob', amount: 100, parts: computer }]
    )

    expect(balances).toEqual([
      { userId: 'lea', name: 'Léa', amount: 33 },
      { userId: 'bob', name: 'Bob', amount: 33 },
      { userId: 'camille', name: 'Camille', amount: -66 }
    ])
    expect(balances.reduce((sum, balance) => sum + balance.amount, 0)).toBe(0)
  })

  it('credits the Provider of a Service only when it is a Service', () => {
    const parts = equalParts(amountFromCents(100), ['lea', 'bob', 'camille'], 'lea')
    const balances = balancesOf(members, [], [{ providerId: 'lea', amount: 100, parts }])

    expect(balances.find(balance => balance.userId === 'lea')?.amount).toBe(66)
  })

  it('debits the debtor and credits the creditor of a Payback', () => {
    const parts = equalParts(amountFromCents(100), ['lea', 'bob', 'camille'], 'lea')
    const balances = balancesOf(
      members,
      [{ payerId: 'lea', amount: 100, parts }],
      [],
      [{ debtorId: 'bob', creditorId: 'lea', amount: 33 }]
    )

    expect(balances).toEqual([
      { userId: 'lea', name: 'Léa', amount: 33 },
      { userId: 'bob', name: 'Bob', amount: 0 },
      { userId: 'camille', name: 'Camille', amount: -33 }
    ])
    expect(balances.reduce((sum, balance) => sum + balance.amount, 0)).toBe(0)
  })

  it('leaves Balances that still sum to 0 after a partial Payback', () => {
    const parts = equalParts(amountFromCents(100), ['lea', 'bob', 'camille'], 'lea')
    const balances = balancesOf(
      members,
      [{ payerId: 'lea', amount: 100, parts }],
      [],
      [{ debtorId: 'bob', creditorId: 'lea', amount: 20 }]
    )

    expect(balances).toEqual([
      { userId: 'lea', name: 'Léa', amount: 46 },
      { userId: 'bob', name: 'Bob', amount: -13 },
      { userId: 'camille', name: 'Camille', amount: -33 }
    ])
    expect(balances.reduce((sum, balance) => sum + balance.amount, 0)).toBe(0)
  })

  it('computes the complete Balance from paid, services, parts, received and paid back', () => {
    const pizza = equalParts(amountFromCents(100), ['lea', 'bob', 'camille'], 'lea')
    const computer = equalParts(amountFromCents(100), ['lea', 'bob', 'camille'], 'bob')
    const balances = balancesOf(
      members,
      [{ payerId: 'lea', amount: 100, parts: pizza }],
      [{ providerId: 'bob', amount: 100, parts: computer }],
      [{ debtorId: 'camille', creditorId: 'lea', amount: 33 }]
    )

    expect(balances).toEqual([
      { userId: 'lea', name: 'Léa', amount: 0 },
      { userId: 'bob', name: 'Bob', amount: 33 },
      { userId: 'camille', name: 'Camille', amount: -33 }
    ])
    expect(balances.reduce((sum, balance) => sum + balance.amount, 0)).toBe(0)
  })
})
