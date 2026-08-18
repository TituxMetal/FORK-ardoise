import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { invalidData } from '../../domain/invalidData.ts'
import type { IExpenseRepository } from '../../expenses/domain/IExpense.repository.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { createGroup } from '../application/CreateGroup.uc.ts'
import { getGroup } from '../application/GetGroup.uc.ts'
import { listGroups } from '../application/ListGroups.uc.ts'
import { GROUP_NAME_REQUIRED } from '../domain/GroupName.vo.ts'
import type { IGroupRepository } from '../domain/IGroup.repository.ts'

const createGroupBody = z.object({
  name: z.string({ error: GROUP_NAME_REQUIRED })
})

export const createGroupsRoutes = (
  groups: IGroupRepository,
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
