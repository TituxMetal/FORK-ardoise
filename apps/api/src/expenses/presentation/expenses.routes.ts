import { Hono } from 'hono'
import { z } from 'zod'
import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { validateBody } from '~/shared/presentation'
import type { SlateView } from '~/groups/application/getSlate.uc'
import { expenseMutation } from '~/expenses/application/expenseMutation.uc'

const expenseBody = z.object({
  label: z.string(),
  day: z.string(),
  amount: z.number(),
  payerId: z.string(),
  participantIds: z.array(z.string()).optional()
})

export const createExpensesRoutes = (expenses: ExpenseRepository, view: SlateView) => {
  const mutation = expenseMutation(expenses, view)

  return new Hono<{ Variables: { userId: string; userName: string } }>()
    .post('/:groupId/expenses', validateBody(expenseBody), async c => {
      const group = await mutation.create.execute(
        c.get('userId'),
        c.req.param('groupId'),
        c.req.valid('json')
      )
      return c.json(group, 201)
    })
    .patch('/:groupId/expenses/:id', validateBody(expenseBody), async c =>
      c.json(
        await mutation.update.execute(
          c.get('userId'),
          c.req.param('groupId'),
          c.req.param('id'),
          c.req.valid('json')
        )
      )
    )
    .delete('/:groupId/expenses/:id', async c =>
      c.json(
        await mutation.delete.execute(c.get('userId'), c.req.param('groupId'), c.req.param('id'))
      )
    )
}
