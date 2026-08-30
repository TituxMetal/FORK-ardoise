import { userNameFrom } from '~/users/domain/userName.vo'
import type { UserRepository } from '~/users/domain/user.repository'

export const updateOwnName = (users: UserRepository) => async (userId: string, name: string) => {
  const userName = userNameFrom(name)
  await users.rename(userId, userName.value)
  return userName.value
}
