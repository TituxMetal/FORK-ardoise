import { expect, test } from 'vite-plus/test'
import { InvalidData } from './InvalidData.error.ts'
import { Montant } from './Montant.vo.ts'

test('fromCents keeps an integer number of cents', () => {
  expect(Montant.fromCents(100).value).toBe(100)
})

test('fromEuros converts to integer cents', () => {
  expect(Montant.fromEuros(12.5).value).toBe(1250)
})

test('fromCents rejects a non-integer', () => {
  expect(() => Montant.fromCents(1.5)).toThrow(InvalidData)
  expect(() => Montant.fromCents(1.5)).toThrow(Montant.INTEGER)
})

test('fromCents rejects zero and below', () => {
  expect(() => Montant.fromCents(0)).toThrow(InvalidData)
  expect(() => Montant.fromCents(0)).toThrow(Montant.POSITIVE)
  expect(() => Montant.fromCents(-1)).toThrow(Montant.POSITIVE)
})

test('fromEuros rejects a value that is not an exact cent', () => {
  expect(() => Montant.fromEuros(1.001)).toThrow(InvalidData)
})

test('two Montants with the same cents are equal', () => {
  expect(Montant.fromCents(100).equals(Montant.fromCents(100))).toBe(true)
  expect(Montant.fromCents(100).equals(Montant.fromCents(101))).toBe(false)
})
