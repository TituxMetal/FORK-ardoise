import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { Jour } from '../../depenses/domain/Jour.vo.ts'
import { Libelle } from '../../depenses/domain/Libelle.vo.ts'
import type { IExpenseRepository } from '../../depenses/domain/IExpense.repository.ts'
import { AMOUNT_POSITIVE } from '../../domain/Amount.ts'
import { invalidData } from '../../domain/invalidData.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
import { CreateService } from '../application/CreateService.uc.ts'
import { DeleteService } from '../application/DeleteService.uc.ts'
import type { IServiceRepository } from '../domain/IService.repository.ts'

const createServiceBody = z.object({
  label: z.string({ error: Libelle.REQUIRED }),
  day: z.string({ error: Jour.REQUIRED }),
  amount: z.number({ error: AMOUNT_POSITIVE }),
  providerId: z.string(),
  participantIds: z.array(z.string()).optional()
})

export const createServicesRoutes = (
  groupes: IGroupRepository,
  depenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const createService = new CreateService(groupes, depenses, services, paybacks)
  const deleteService = new DeleteService(groupes, depenses, services, paybacks)

  app.post(
    '/:groupeId/services',
    zValidator('json', createServiceBody, result => {
      if (!result.success) {
        const issue = result.error.issues[0]
        throw invalidData(issue?.message ?? Libelle.REQUIRED)
      }
    }),
    async c => {
      const groupe = await createService.execute(
        c.get('userId'),
        c.req.param('groupeId'),
        c.req.valid('json')
      )
      return c.json(groupe, 201)
    }
  )

  app.delete('/:groupeId/services/:id', async c =>
    c.json(await deleteService.execute(c.get('userId'), c.req.param('groupeId'), c.req.param('id')))
  )

  return app
}
