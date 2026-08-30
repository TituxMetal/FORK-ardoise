import { describe, expect, it } from 'vite-plus/test'
import { USER_NAME_REQUIRED } from '~/users/domain/userName.vo'
import type { UserRepository } from '~/users/domain/user.repository'
import { updateOwnName } from './updateOwnName.uc'

const repository = (renamed: Array<{ userId: string; name: string }> = []): UserRepository => ({
  rename: async (userId, name) => {
    renamed.push({ userId, name })
  }
})

describe('updateOwnName', () => {
  it('renames the User with the trimmed name and returns it', async () => {
    const renamed: Array<{ userId: string; name: string }> = []
    const rename = updateOwnName(repository(renamed))

    const result = await rename('u1', '  Léa P.  ')

    expect(renamed).toEqual([{ userId: 'u1', name: 'Léa P.' }])
    expect(result).toBe('Léa P.')
  })

  it('refuses a blank name without renaming', async () => {
    const renamed: Array<{ userId: string; name: string }> = []
    const rename = updateOwnName(repository(renamed))

    const attempt = rename('u1', '   ')

    await expect(attempt).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: USER_NAME_REQUIRED
    })
    expect(renamed).toEqual([])
  })
})
