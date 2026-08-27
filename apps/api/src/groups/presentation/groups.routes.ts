import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { invalidData } from '~/shared/domain'
import type { IExpenseRepository } from '~/expenses/domain/IExpense.repository'
import type { IPaybackRepository } from '~/paybacks/domain/IPayback.repository'
import type { IServiceRepository } from '~/services/domain/IService.repository'
import { createGroup } from '~/groups/application/createGroup.uc'
import { getGroup } from '~/groups/application/getGroup.uc'
import { listGroups } from '~/groups/application/listGroups.uc'
import { GROUP_NAME_REQUIRED } from '~/groups/domain/groupName.vo'
import type { GroupRepository } from '~/groups/domain/group.repository'

const createGroupBody = z.object({
  name: z.string({ error: GROUP_NAME_REQUIRED })
})

export const createGroupsRoutes = (
  groups: GroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const createGroupUseCase = createGroup(groups)
  const listGroupsUseCase = listGroups(groups)
  const getGroupUseCase = getGroup(groups, expenses, services, paybacks)

  app.post(
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

  app.get('/', async c => c.json(await listGroupsUseCase.execute(c.get('userId'))))

  app.get('/:id', async c =>
    c.json(await getGroupUseCase.execute(c.get('userId'), c.req.param('id')))
  )

  return app
}
