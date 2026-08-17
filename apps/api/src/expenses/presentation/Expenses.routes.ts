import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { AMOUNT_POSITIVE } from '../../domain/Amount.ts'
import { invalidData } from '../../domain/invalidData.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { createExpense } from '../application/CreateExpense.uc.ts'
import { deleteExpense } from '../application/DeleteExpense.uc.ts'
import { DAY_REQUIRED } from '../domain/Day.vo.ts'
import type { IExpenseRepository } from '../domain/IExpense.repository.ts'
import { LABEL_REQUIRED } from '../domain/Label.vo.ts'

const createExpenseBody = z.object({
  label: z.string({ error: LABEL_REQUIRED }),
  day: z.string({ error: DAY_REQUIRED }),
  amount: z.number({ error: AMOUNT_POSITIVE }),
  payerId: z.string(),
  participantIds: z.array(z.string()).optional()
})

export const createExpensesRoutes = (
  groupes: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const createExpenseUseCase = createExpense(groupes, expenses, services, paybacks)
  const deleteExpenseUseCase = deleteExpense(groupes, expenses, services, paybacks)

  app.post(
    '/:groupeId/expenses',
    zValidator('json', createExpenseBody, result => {
      if (!result.success) {
        const issue = result.error.issues[0]
        throw invalidData(issue?.message ?? LABEL_REQUIRED)
      }
    }),
    async c => {
      const groupe = await createExpenseUseCase.execute(
        c.get('userId'),
        c.req.param('groupeId'),
        c.req.valid('json')
      )
      return c.json(groupe, 201)
    }
  )

  app.delete('/:groupeId/expenses/:id', async c =>
    c.json(
      await deleteExpenseUseCase.execute(
        c.get('userId'),
        c.req.param('groupeId'),
        c.req.param('id')
      )
    )
  )

  return app
}
