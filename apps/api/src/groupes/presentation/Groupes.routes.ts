import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import type { IDepenseRepository } from '../../depenses/domain/IDepense.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { InvalidData } from '../../domain/InvalidData.error.ts'
import { CreateGroupe } from '../application/CreateGroupe.uc.ts'
import { GetGroupe } from '../application/GetGroupe.uc.ts'
import { ListGroupes } from '../application/ListGroupes.uc.ts'
import { GroupeName } from '../domain/GroupeName.vo.ts'
import type { IGroupeRepository } from '../domain/IGroupe.repository.ts'

const createGroupeBody = z.object({
  name: z.string({ error: GroupeName.REQUIRED })
})

export const createGroupesRoutes = (
  groupes: IGroupeRepository,
  depenses: IDepenseRepository,
  services: IServiceRepository
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const createGroupe = new CreateGroupe(groupes)
  const listGroupes = new ListGroupes(groupes)
  const getGroupe = new GetGroupe(groupes, depenses, services)

  app.post(
    '/',
    zValidator('json', createGroupeBody, result => {
      if (!result.success) {
        throw new InvalidData(GroupeName.REQUIRED)
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
