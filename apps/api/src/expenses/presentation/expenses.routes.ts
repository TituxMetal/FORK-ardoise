import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { DAY_REQUIRED } from '~/expenses/domain/day.vo'
import { LABEL_REQUIRED } from '~/expenses/domain/label.vo'
import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { AMOUNT_POSITIVE, invalidData } from '~/shared/domain'

import type { GroupRepository } from '~/groups/domain/group.repository'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'
import type { ServiceRepository } from '~/services/domain/service.repository'
import { createExpense } from '~/expenses/application/createExpense.uc'
import { deleteExpense } from '~/expenses/application/deleteExpense.uc'

const createExpenseBody = z.object({
  label: z.string({ error: LABEL_REQUIRED }),
  day: z.string({ error: DAY_REQUIRED }),
  amount: z.number({ error: AMOUNT_POSITIVE }),
  payerId: z.string(),
  participantIds: z.array(z.string()).optional()
})

export const createExpensesRoutes = (
  groups: GroupRepository,
  expenses: ExpenseRepository,
  services: ServiceRepository,
  paybacks: PaybackRepository
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const createExpenseUseCase = createExpense(groups, expenses, services, paybacks)
  const deleteExpenseUseCase = deleteExpense(groups, expenses, services, paybacks)

  app.post(
    '/:groupId/expenses',
    zValidator('json', createExpenseBody, result => {
      if (!result.success) {
        const issue = result.error.issues[0]
        throw invalidData(issue?.message ?? LABEL_REQUIRED)
      }
    }),
    async c => {
      const group = await createExpenseUseCase.execute(
        c.get('userId'),
        c.req.param('groupId'),
        c.req.valid('json')
      )
      return c.json(group, 201)
    }
  )

  app.delete('/:groupId/expenses/:id', async c =>
    c.json(
      await deleteExpenseUseCase.execute(c.get('userId'), c.req.param('groupId'), c.req.param('id'))
    )
  )

  return app
}
