import { expect, test } from 'vite-plus/test'
import { InvalidData } from './InvalidData.error.ts'
import { Montant } from './Montant.vo.ts'
import { Parts } from './Parts.ts'

test('100 cents among 3 Participants gives the Payeur the remainder', () => {
  const parts = Parts.equal(Montant.fromCents(100), ['lea', 'bob', 'camille'], 'lea')

  expect(parts.list.map(part => [part.userId, part.amount.value])).toEqual([
    ['lea', 34],
    ['bob', 33],
    ['camille', 33]
  ])
})

test('remainder still goes to a Payeur outside the Participants', () => {
  const parts = Parts.equal(Montant.fromCents(100), ['bob', 'camille', 'dan'], 'lea')

  expect(parts.list.map(part => [part.userId, part.amount.value])).toEqual([
    ['bob', 33],
    ['camille', 33],
    ['dan', 33],
    ['lea', 1]
  ])
})

test('2 cents among 3 Participants gives the Payeur the remainder and zero Parts', () => {
  const parts = Parts.equal(Montant.fromCents(2), ['lea', 'bob', 'camille'], 'lea')

  expect(parts.list.map(part => [part.userId, part.amount.value])).toEqual([
    ['lea', 2],
    ['bob', 0],
    ['camille', 0]
  ])
})

test('equal Parts refuse zero Participants', () => {
  expect(() => Parts.equal(Montant.fromCents(100), [], 'lea')).toThrow(InvalidData)
  expect(() => Parts.equal(Montant.fromCents(100), [], 'lea')).toThrow(Parts.PARTICIPANTS_REQUIRED)
})
