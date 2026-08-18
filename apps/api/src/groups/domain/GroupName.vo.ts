import { invalidData } from '../../domain/invalidData.ts'

export type GroupName = {
  value: string
}

export const GROUP_NAME_REQUIRED = 'Nom du Groupe requis'

export const groupNameFrom = (value: string): GroupName => {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throw invalidData(GROUP_NAME_REQUIRED)
  }
  return { value: trimmed }
}

export const groupNameReconstitute = (value: string): GroupName => ({ value })
