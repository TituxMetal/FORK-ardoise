import { Hono } from 'hono'
import { z } from 'zod'
import { validateBody } from '~/shared/presentation'
import { type SlateView, createGroup, leaveGroup, listGroups, renameGroup } from '../application'
import type { GroupRepository } from '../domain'

const groupNameBody = z.object({
  name: z.string()
})

export const createGroupsRoutes = (groups: GroupRepository, view: SlateView) => {
  const createGroupUseCase = createGroup(groups, view)
  const listGroupsUseCase = listGroups(groups)
  const renameGroupUseCase = renameGroup(groups)
  const leaveGroupUseCase = leaveGroup(groups)

  return new Hono<{ Variables: { userId: string; userName: string } }>()
    .post('/', validateBody(groupNameBody), async c => {
      const { name } = c.req.valid('json')
      const group = await createGroupUseCase.execute(c.get('userId'), c.get('userName'), name)
      return c.json(group, 201)
    })
    .get('/', async c => c.json(await listGroupsUseCase.execute(c.get('userId'))))
    .get('/:id', async c => c.json(await view.execute(c.get('userId'), c.req.param('id'))))
    .patch('/:id', validateBody(groupNameBody), async c => {
      const { name } = c.req.valid('json')
      return c.json(await renameGroupUseCase.execute(c.get('userId'), c.req.param('id'), name))
    })
    .delete('/:id', async c => {
      await leaveGroupUseCase.execute(c.get('userId'), c.req.param('id'))
      return c.body(null, 204)
    })
}
