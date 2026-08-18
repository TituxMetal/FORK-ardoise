import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { DAY_REQUIRED } from '../../expenses/domain/Day.vo.ts'
import { LABEL_REQUIRED } from '../../expenses/domain/Label.vo.ts'
import type { IExpenseRepository } from '../../expenses/domain/IExpense.repository.ts'
import { AMOUNT_POSITIVE } from '../../domain/Amount.ts'
import { invalidData } from '../../domain/invalidData.ts'
import type { IGroupRepository } from '../../groups/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
import { createService } from '../application/CreateService.uc.ts'
import { deleteService } from '../application/DeleteService.uc.ts'
import type { IServiceRepository } from '../domain/IService.repository.ts'

const createServiceBody = z.object({
  label: z.string({ error: LABEL_REQUIRED }),
  day: z.string({ error: DAY_REQUIRED }),
  amount: z.number({ error: AMOUNT_POSITIVE }),
  providerId: z.string(),
  participantIds: z.array(z.string()).optional()
})

export const createServicesRoutes = (
  groups: IGroupRepository,
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
