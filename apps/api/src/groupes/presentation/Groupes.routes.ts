import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import type { IExpenseRepository } from '../../expenses/domain/IExpense.repository.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { invalidData } from '../../domain/invalidData.ts'
import { CreateGroupe } from '../application/CreateGroupe.uc.ts'
import { GetGroupe } from '../application/GetGroupe.uc.ts'
import { ListGroupes } from '../application/ListGroupes.uc.ts'
import { GroupeName } from '../domain/GroupeName.vo.ts'
import type { IGroupRepository } from '../domain/IGroup.repository.ts'

const createGroupeBody = z.object({
  name: z.string({ error: GroupeName.REQUIRED })
})

export const createGroupesRoutes = (
  groupes: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const createGroupe = new CreateGroupe(groupes)
  const listGroupes = new ListGroupes(groupes)
  const getGroupe = new GetGroupe(groupes, expenses, services, paybacks)

  app.post(
    '/',
    zValidator('json', createGroupeBody, result => {
      if (!result.success) {
        throw invalidData(GroupeName.REQUIRED)
      }
    }),
    async c => {
      const { name } = c.req.valid('json')
      const groupe = await createGroupe.execute(c.get('userId'), c.get('userName'), name)
      return c.json(groupe, 201)
    }
  )

  app.get('/', async c => c.json(await listGroupes.execute(c.get('userId'))))

  app.get('/:id', async c => c.json(await getGroupe.execute(c.get('userId'), c.req.param('id'))))

  return app
}
