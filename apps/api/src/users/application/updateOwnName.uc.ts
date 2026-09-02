import { userNameFrom, type UserRepository } from '../domain'

export const updateOwnName = (users: UserRepository) => async (userId: string, name: string) => {
  const userName = userNameFrom(name)
  await users.rename(userId, userName.value)
  return userName.value
}
