import { expect, test } from 'vite-plus/test'
import { Montant } from './Montant.vo.ts'
import { Parts } from './Parts.ts'
import { soldesOf } from './Solde.ts'

const membres = [
  { userId: 'lea', name: 'Léa' },
  { userId: 'bob', name: 'Bob' },
  { userId: 'camille', name: 'Camille' }
]

test('100 cents, 3 Participants, Payeur participant: Payeur Solde +66', () => {
  const parts = Parts.equal(Montant.fromCents(100), ['lea', 'bob', 'camille'], 'lea')
  const soldes = soldesOf(membres, [{ payerId: 'lea', amount: 100, parts: parts.list }])

  expect(soldes).toEqual([
    { userId: 'lea', name: 'Léa', amount: 66 },
    { userId: 'bob', name: 'Bob', amount: -33 },
    { userId: 'camille', name: 'Camille', amount: -33 }
  ])
})

test('Payeur outside Participants still receives the remainder and Soldes sum to 0', () => {
  const people = [...membres, { userId: 'dan', name: 'Dan' }]
  const parts = Parts.equal(Montant.fromCents(100), ['bob', 'camille', 'dan'], 'lea')
  const soldes = soldesOf(people, [{ payerId: 'lea', amount: 100, parts: parts.list }])

  expect(soldes).toEqual([
    { userId: 'lea', name: 'Léa', amount: 99 },
    { userId: 'bob', name: 'Bob', amount: -33 },
    { userId: 'camille', name: 'Camille', amount: -33 },
    { userId: 'dan', name: 'Dan', amount: -33 }
  ])
  expect(soldes.reduce((sum, solde) => sum + solde.amount, 0)).toBe(0)
})

test('a Dépense in one Groupe does not change Soldes of another', () => {
  const parts = Parts.equal(Montant.fromCents(100), ['lea', 'bob', 'camille'], 'lea')
  const potes = soldesOf(membres, [{ payerId: 'lea', amount: 100, parts: parts.list }])
  const collegues = soldesOf(
    [
      { userId: 'lea', name: 'Léa' },
      { userId: 'eve', name: 'Eve' }
    ],
    []
  )

  expect(potes.find(solde => solde.userId === 'lea')?.amount).toBe(66)
  expect(collegues).toEqual([
    { userId: 'lea', name: 'Léa', amount: 0 },
    { userId: 'eve', name: 'Eve', amount: 0 }
  ])
})

test('100 cents, 3 Participants, Prestataire participant: same split as the Dépense', () => {
  const parts = Parts.equal(Montant.fromCents(100), ['lea', 'bob', 'camille'], 'lea')
  const soldes = soldesOf(membres, [], [{ providerId: 'lea', amount: 100, parts: parts.list }])

  expect(soldes).toEqual([
    { userId: 'lea', name: 'Léa', amount: 66 },
    { userId: 'bob', name: 'Bob', amount: -33 },
    { userId: 'camille', name: 'Camille', amount: -33 }
  ])
})

test('Pizza then Service in the same Groupe cancel out', () => {
  const pizza = Parts.equal(Montant.fromCents(100), ['lea', 'bob', 'camille'], 'lea')
  const ordi = Parts.equal(Montant.fromCents(100), ['lea', 'bob', 'camille'], 'bob')
  const soldes = soldesOf(
    membres,
    [{ payerId: 'lea', amount: 100, parts: pizza.list }],
    [{ providerId: 'bob', amount: 100, parts: ordi.list }]
  )

  expect(soldes).toEqual([
    { userId: 'lea', name: 'Léa', amount: 33 },
    { userId: 'bob', name: 'Bob', amount: 33 },
    { userId: 'camille', name: 'Camille', amount: -66 }
  ])
  expect(soldes.reduce((sum, solde) => sum + solde.amount, 0)).toBe(0)
})

test('a Service is not a Dépense: only services reconnus credit the Prestataire', () => {
  const parts = Parts.equal(Montant.fromCents(100), ['lea', 'bob', 'camille'], 'lea')
  const soldes = soldesOf(membres, [], [{ providerId: 'lea', amount: 100, parts: parts.list }])

  expect(soldes.find(solde => solde.userId === 'lea')?.amount).toBe(66)
})
