import { expect, test } from 'vite-plus/test'
import { InvalidData } from '../../domain/InvalidData.error.ts'
import { Montant } from '../../domain/Montant.vo.ts'
import { Reglement } from './Reglement.entity.ts'

test('plafond is min of what the débiteur owes and what the créancier is owed', () => {
  expect(Reglement.plafond(-33, 66)).toBe(33)
  expect(Reglement.plafond(-66, 33)).toBe(33)
})

test('a partial Règlement under the plafond is accepted', () => {
  const reglement = Reglement.create('groupe', 'bob', 'lea', Montant.fromCents(20), -33, 66)

  expect(reglement.debtorId).toBe('bob')
  expect(reglement.creditorId).toBe('lea')
  expect(reglement.amount.value).toBe(20)
})

test('a Règlement equal to the plafond is accepted', () => {
  const reglement = Reglement.create('groupe', 'bob', 'lea', Montant.fromCents(33), -33, 66)

  expect(reglement.amount.value).toBe(33)
})

test('a Règlement above the plafond is refused', () => {
  expect(() => Reglement.create('groupe', 'bob', 'lea', Montant.fromCents(34), -33, 66)).toThrow(
    InvalidData
  )
  expect(() => Reglement.create('groupe', 'bob', 'lea', Montant.fromCents(34), -33, 66)).toThrow(
    Reglement.ABOVE_PLAFOND
  )
})

test('a débiteur who is not négatif is refused', () => {
  expect(() => Reglement.create('groupe', 'bob', 'lea', Montant.fromCents(10), 0, 66)).toThrow(
    Reglement.DEBTOR_NOT_NEGATIVE
  )
  expect(() => Reglement.create('groupe', 'bob', 'lea', Montant.fromCents(10), 10, 66)).toThrow(
    Reglement.DEBTOR_NOT_NEGATIVE
  )
})

test('a créancier who is not positif is refused', () => {
  expect(() => Reglement.create('groupe', 'bob', 'lea', Montant.fromCents(10), -33, 0)).toThrow(
    Reglement.CREDITOR_NOT_POSITIVE
  )
  expect(() => Reglement.create('groupe', 'bob', 'lea', Montant.fromCents(10), -33, -10)).toThrow(
    Reglement.CREDITOR_NOT_POSITIVE
  )
})
