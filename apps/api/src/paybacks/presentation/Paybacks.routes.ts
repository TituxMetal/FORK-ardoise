import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { AMOUNT_POSITIVE, invalidData } from '~/shared/domain'

import type { GroupRepository } from '~/groups/domain/group.repository'
import type { IServiceRepository } from '~/services/domain/IService.repository'
import { createPayback } from '~/paybacks/application/CreatePayback.uc'
import { deletePayback } from '~/paybacks/application/DeletePayback.uc'
import type { IPaybackRepository } from '~/paybacks/domain/IPayback.repository'

const createPaybackBody = z.object({
  debtorId: z.string(),
  creditorId: z.string(),
  amount: z.number({ error: AMOUNT_POSITIVE })
})

export const createPaybacksRoutes = (
  groups: GroupRepository,
  expenses: ExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const createPaybackUseCase = createPayback(groups, expenses, services, paybacks)
  const deletePaybackUseCase = deletePayback(groups, expenses, services, paybacks)

  app.post(
    '/:groupId/paybacks',
    zValidator('json', createPaybackBody, result => {
      if (!result.success) {
        const issue = result.error.issues[0]
        throw invalidData(issue?.message ?? AMOUNT_POSITIVE)
      }
    }),
    async c => {
      const group = await createPaybackUseCase.execute(
        c.get('userId'),
        c.req.param('groupId'),
        c.req.valid('json')
      )
      return c.json(group, 201)
    }
  )

  app.delete('/:groupId/paybacks/:id', async c =>
    c.json(
      await deletePaybackUseCase.execute(c.get('userId'), c.req.param('groupId'), c.req.param('id'))
    )
  )

  return app
}
