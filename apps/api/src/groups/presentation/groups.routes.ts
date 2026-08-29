import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { invalidData } from '~/shared/domain'
import type { SlateView } from '~/groups/application/getSlate.uc'
import { createGroup } from '~/groups/application/createGroup.uc'
import { listGroups } from '~/groups/application/listGroups.uc'
import { GROUP_NAME_REQUIRED } from '~/groups/domain/groupName.vo'
import type { GroupRepository } from '~/groups/domain/group.repository'

const createGroupBody = z.object({
  name: z.string({ error: GROUP_NAME_REQUIRED })
})

export const createGroupsRoutes = (groups: GroupRepository, view: SlateView) => {
  const createGroupUseCase = createGroup(groups, view)
  const listGroupsUseCase = listGroups(groups)

  return new Hono<{ Variables: { userId: string; userName: string } }>()
    .post(
      '/',
      zValidator('json', createGroupBody, result => {
        if (!result.success) {
          throw invalidData(GROUP_NAME_REQUIRED)
        }
      }),
      async c => {
        const { name } = c.req.valid('json')
        const group = await createGroupUseCase.execute(c.get('userId'), c.get('userName'), name)
        return c.json(group, 201)
      }
    )
    .get('/', async c => c.json(await listGroupsUseCase.execute(c.get('userId'))))
    .get('/:id', async c => c.json(await view.execute(c.get('userId'), c.req.param('id'))))
}
