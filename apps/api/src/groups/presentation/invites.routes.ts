import { Hono } from 'hono'
import { joinGroup } from '~/groups/application/joinGroup.uc'
import type { GroupRepository } from '~/groups/domain/group.repository'

export const createInvitesRoutes = (groups: GroupRepository) => {
  const joinGroupUseCase = joinGroup(groups)

  return new Hono<{ Variables: { userId: string; userName: string } }>().post('/:secret', async c =>
    c.json(
      await joinGroupUseCase.execute(c.get('userId'), c.get('userName'), c.req.param('secret'))
    )
  )
}
