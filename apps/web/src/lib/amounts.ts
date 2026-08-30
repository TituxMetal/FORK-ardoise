import { z } from 'zod'

export const euros = (cents: number) =>
  `${cents < 0 ? '−' : ''}${(Math.abs(cents) / 100).toFixed(2).replace('.', ',')} €`

// Signed display for member balance chips: an explicit sign so a Member reads
// at a glance who is in credit (+) and who is in debit (−). Zero stays unsigned.
export const signedEuros = (cents: number) => (cents > 0 ? '+' : '') + euros(cents)

export const centsFromEuros = (value: string) => Math.round(Number(value.replace(',', '.')) * 100)
// Inverse of centsFromEuros: the euro string an Amount input is pre-filled
// with when editing (no sign, no euro mark).
export const eurosFromCents = (cents: number) => (cents / 100).toFixed(2).replace('.', ',')

// Mirrors the API Amount rule (positive) for the euro string a form types in.
// Restricts to whole euros or one/two decimals so every accepted value maps
// exactly to positive integer cents (centsFromEuros).
export const eurosAmountSchema = z
  .string()
  .trim()
  .refine(value => value !== '', 'Montant > 0 requis')
  .regex(/^\d+(?:[.,]\d{1,2})?$/, 'Montant invalide')
  .refine(value => Number(value.replace(',', '.')) > 0, 'Montant > 0 requis')
