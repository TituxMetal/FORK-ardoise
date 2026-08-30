import { invalidData } from '~/shared/domain'

export type UserName = {
  value: string
}

export const USER_NAME_REQUIRED = 'Nom requis'

export const userNameFrom = (value: string): UserName => {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throw invalidData(USER_NAME_REQUIRED)
  }
  return { value: trimmed }
}
