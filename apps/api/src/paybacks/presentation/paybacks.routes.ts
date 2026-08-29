import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { AMOUNT_POSITIVE, invalidData } from '~/shared/domain'

import type { GroupRepository } from '~/groups/domain/group.repository'
import type { ServiceRepository } from '~/services/domain/service.repository'
import { createPayback } from '~/paybacks/application/createPayback.uc'
import { deletePayback } from '~/paybacks/application/deletePayback.uc'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'

const createPaybackBody = z.object({
  debtorId: z.string(),
  creditorId: z.string(),
  amount: z.number({ error: AMOUNT_POSITIVE })
})

export const createPaybacksRoutes = (
  groups: GroupRepository,
  expenses: ExpenseRepository,
  services: ServiceRepository,
  paybacks: PaybackRepository
) => {
  const createPaybackUseCase = createPayback(groups, expenses, services, paybacks)
  const deletePaybackUseCase = deletePayback(groups, expenses, services, paybacks)

  return new Hono<{ Variables: { userId: string; userName: string } }>()
    .post(
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
    .delete('/:groupId/paybacks/:id', async c =>
      c.json(
        await deletePaybackUseCase.execute(
          c.get('userId'),
          c.req.param('groupId'),
          c.req.param('id')
        )
      )
    )
}
