import { Hono } from 'hono'
import { joinGroup } from '../application/JoinGroup.uc.ts'
import type { IGroupRepository } from '../domain/IGroup.repository.ts'

export const createInvitesRoutes = (groups: IGroupRepository) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const joinGroupUseCase = joinGroup(groups)

  app.post('/:secret', async c =>
    c.json(
      await joinGroupUseCase.execute(c.get('userId'), c.get('userName'), c.req.param('secret'))
    )
  )

  return app
}
