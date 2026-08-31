import { Hono } from 'hono'
import type { SlateView } from '~/groups/application/getSlate.uc'
import { joinGroup } from '~/groups/application/joinGroup.uc'
import { previewInvite } from '~/groups/application/previewInvite.uc'
import type { GroupRepository } from '~/groups/domain/group.repository'

export const createInvitePreviewRoutes = (groups: GroupRepository) => {
  const previewInviteUseCase = previewInvite(groups)

  return new Hono().get('/:secret/preview', async c =>
    c.json(await previewInviteUseCase.execute(c.req.param('secret')))
  )
}

export const createInvitesRoutes = (groups: GroupRepository, view: SlateView) => {
  const joinGroupUseCase = joinGroup(groups, view)

  return new Hono<{ Variables: { userId: string; userName: string } }>().post('/:secret', async c =>
    c.json(
      await joinGroupUseCase.execute(c.get('userId'), c.get('userName'), c.req.param('secret'))
    )
  )
}
