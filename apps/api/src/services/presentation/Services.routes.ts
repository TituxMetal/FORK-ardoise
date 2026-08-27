import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { DAY_REQUIRED } from '~/expenses/domain/Day.vo'
import { LABEL_REQUIRED } from '~/expenses/domain/Label.vo'
import type { IExpenseRepository } from '~/expenses/domain/IExpense.repository'
import { AMOUNT_POSITIVE, invalidData } from '~/shared/domain'

import type { GroupRepository } from '~/groups/domain/group.repository'
import type { IPaybackRepository } from '~/paybacks/domain/IPayback.repository'
import { createService } from '~/services/application/CreateService.uc'
import { deleteService } from '~/services/application/DeleteService.uc'
import type { IServiceRepository } from '~/services/domain/IService.repository'

const createServiceBody = z.object({
  label: z.string({ error: LABEL_REQUIRED }),
  day: z.string({ error: DAY_REQUIRED }),
  amount: z.number({ error: AMOUNT_POSITIVE }),
  providerId: z.string(),
  participantIds: z.array(z.string()).optional()
})

export const createServicesRoutes = (
  groups: GroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const createServiceUseCase = createService(groups, expenses, services, paybacks)
  const deleteServiceUseCase = deleteService(groups, expenses, services, paybacks)

  app.post(
    '/:groupId/services',
    zValidator('json', createServiceBody, result => {
      if (!result.success) {
        const issue = result.error.issues[0]
        throw invalidData(issue?.message ?? LABEL_REQUIRED)
      }
    }),
    async c => {
      const group = await createServiceUseCase.execute(
        c.get('userId'),
        c.req.param('groupId'),
        c.req.valid('json')
      )
      return c.json(group, 201)
    }
  )

  app.delete('/:groupId/services/:id', async c =>
    c.json(
      await deleteServiceUseCase.execute(c.get('userId'), c.req.param('groupId'), c.req.param('id'))
    )
  )

  return app
}
