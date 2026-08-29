import { Hono } from 'hono'
import { z } from 'zod'
import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { validateBody } from '~/shared/presentation'
import type { SlateView } from '~/groups/application/getSlate.uc'
import { createExpense } from '~/expenses/application/createExpense.uc'
import { deleteExpense } from '~/expenses/application/deleteExpense.uc'

const createExpenseBody = z.object({
  label: z.string(),
  day: z.string(),
  amount: z.number(),
  payerId: z.string(),
  participantIds: z.array(z.string()).optional()
})

export const createExpensesRoutes = (expenses: ExpenseRepository, view: SlateView) => {
  const createExpenseUseCase = createExpense(expenses, view)
  const deleteExpenseUseCase = deleteExpense(expenses, view)

  return new Hono<{ Variables: { userId: string; userName: string } }>()
    .post('/:groupId/expenses', validateBody(createExpenseBody), async c => {
      const group = await createExpenseUseCase.execute(
        c.get('userId'),
        c.req.param('groupId'),
        c.req.valid('json')
      )
      return c.json(group, 201)
    })
    .delete('/:groupId/expenses/:id', async c =>
      c.json(
        await deleteExpenseUseCase.execute(
          c.get('userId'),
          c.req.param('groupId'),
          c.req.param('id')
        )
      )
    )
}
