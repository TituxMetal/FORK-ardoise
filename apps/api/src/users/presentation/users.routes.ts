import { Hono } from 'hono'
import { z } from 'zod'
import { validateBody } from '~/shared/presentation'
import { updateOwnName } from '~/users/application/updateOwnName.uc'
import type { UserRepository } from '~/users/domain/user.repository'

const updateNameBody = z.object({
  name: z.string()
})

export const createUsersRoutes = (users: UserRepository) => {
  const updateOwnNameUseCase = updateOwnName(users)

  return new Hono<{ Variables: { userId: string; userName: string } }>().patch(
    '/me',
    validateBody(updateNameBody),
    async c => {
      const { name } = c.req.valid('json')
      return c.json({ name: await updateOwnNameUseCase(c.get('userId'), name) })
    }
  )
}
