import { invalidData } from './invalidData.vo'

export type Day = {
  value: string
}

export const DAY_REQUIRED = 'Jour requis'

export const dayFrom = (value: string): Day => {
  const trimmed = value.trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (!match) {
    throw invalidData(DAY_REQUIRED)
  }
  const [, year, month, day] = match
  // A Date.UTC round-trip is the cheapest way to reject impossible dates
  // (2026-02-31, 2026-13-01) and get leap years right.
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    throw invalidData(DAY_REQUIRED)
  }
  return { value: trimmed }
}

export const dayReconstitute = (value: string): Day => ({ value })
