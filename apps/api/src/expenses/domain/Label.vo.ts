import { invalidData } from '~/shared/domain'

export type Label = {
  value: string
}

export const LABEL_REQUIRED = 'Libellé requis'

export const labelFrom = (value: string): Label => {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throw invalidData(LABEL_REQUIRED)
  }
  return { value: trimmed }
}

export const labelReconstitute = (value: string): Label => ({ value })
