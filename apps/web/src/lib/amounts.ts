import { z } from 'zod'

export const euros = (cents: number) =>
  `${cents < 0 ? '−' : ''}${(Math.abs(cents) / 100).toFixed(2).replace('.', ',')} €`

export const centsFromEuros = (value: string) => Math.round(Number(value.replace(',', '.')) * 100)

// Mirrors the API Amount rule (positive) for the euro string a form types in.
// Restricts to whole euros or one/two decimals so every accepted value maps
// exactly to positive integer cents (centsFromEuros).
export const eurosAmountSchema = z
  .string()
  .trim()
  .refine(value => value !== '', 'Montant > 0 requis')
  .regex(/^\d+(?:[.,]\d{1,2})?$/, 'Montant invalide')
  .refine(value => Number(value.replace(',', '.')) > 0, 'Montant > 0 requis')
