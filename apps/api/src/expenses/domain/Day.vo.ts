import { invalidData } from '../../domain/invalidData.ts'

export type Day = {
  value: string
}

export const DAY_REQUIRED = 'Jour requis'

export const dayFrom = (value: string): Day => {
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw invalidData(DAY_REQUIRED)
  }
  return { value: trimmed }
}

export const dayReconstitute = (value: string): Day => ({ value })
