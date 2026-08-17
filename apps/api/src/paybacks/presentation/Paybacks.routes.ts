import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import type { IExpenseRepository } from '../../expenses/domain/IExpense.repository.ts'
import { AMOUNT_POSITIVE } from '../../domain/Amount.ts'
import { invalidData } from '../../domain/invalidData.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { createPayback } from '../application/CreatePayback.uc.ts'
import { deletePayback } from '../application/DeletePayback.uc.ts'
import type { IPaybackRepository } from '../domain/IPayback.repository.ts'

const createPaybackBody = z.object({
  debtorId: z.string(),
  creditorId: z.string(),
  amount: z.number({ error: AMOUNT_POSITIVE })
})

export const createPaybacksRoutes = (
  groupes: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const createPaybackUseCase = createPayback(groupes, expenses, services, paybacks)
  const deletePaybackUseCase = deletePayback(groupes, expenses, services, paybacks)

  app.post(
    '/:groupeId/paybacks',
    zValidator('json', createPaybackBody, result => {
      if (!result.success) {
        const issue = result.error.issues[0]
        throw invalidData(issue?.message ?? AMOUNT_POSITIVE)
      }
    }),
    async c => {
      const groupe = await createPaybackUseCase.execute(
        c.get('userId'),
        c.req.param('groupeId'),
        c.req.valid('json')
      )
      return c.json(groupe, 201)
    }
  )

  app.delete('/:groupeId/paybacks/:id', async c =>
    c.json(
      await deletePaybackUseCase.execute(
        c.get('userId'),
        c.req.param('groupeId'),
        c.req.param('id')
      )
    )
  )

  return app
}
