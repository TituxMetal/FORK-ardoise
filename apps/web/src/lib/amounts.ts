import { z } from 'zod'

export const euros = (cents: number) =>
  `${cents < 0 ? '−' : ''}${(Math.abs(cents) / 100).toFixed(2).replace('.', ',')} €`

export const centsFromEuros = (value: string) => Math.round(Number(value.replace(',', '.')) * 100)

// Mirrors the API Amount rule (positive) for the euro string a form types in.
export const eurosAmountSchema = z
  .string()
  .refine(value => Number.isFinite(Number(value.replace(',', '.'))), 'Montant invalide')
  .refine(value => Number(value.replace(',', '.')) > 0, 'Montant > 0 requis')
