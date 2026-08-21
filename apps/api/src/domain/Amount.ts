import { invalidData } from '~/domain/invalidData'

export type Amount = {
  value: number
}

export const AMOUNT_POSITIVE = 'Montant en centimes > 0 requis'
export const AMOUNT_INTEGER = 'Montant en centimes entiers requis'

const amountFromCentsAtLeast = (cents: number, minimum: number): Amount => {
  if (!Number.isInteger(cents)) {
    throw invalidData(AMOUNT_INTEGER)
  }
  if (cents < minimum) {
    throw invalidData(AMOUNT_POSITIVE)
  }
  return { value: cents }
}

export const amountFromCents = (cents: number): Amount => amountFromCentsAtLeast(cents, 1)

export const amountFromNonNegativeCents = (cents: number): Amount =>
  amountFromCentsAtLeast(cents, 0)

export const amountFromEuros = (euros: number): Amount => {
  const cents = euros * 100
  if (Math.abs(cents - Math.round(cents)) > 1e-8) {
    throw invalidData(AMOUNT_INTEGER)
  }
  return amountFromCents(Math.round(cents))
}

export const amountReconstitute = (cents: number): Amount => ({ value: cents })
