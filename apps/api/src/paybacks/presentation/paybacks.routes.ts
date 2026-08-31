import { Hono } from 'hono'
import { z } from 'zod'
import { validateBody } from '~/shared/presentation'
import type { SlateView } from '~/groups/application/getSlate.uc'
import { createPayback } from '~/paybacks/application/createPayback.uc'
import { deletePayback } from '~/paybacks/application/deletePayback.uc'
import { updatePayback } from '~/paybacks/application/updatePayback.uc'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'

const paybackBody = z.object({
  debtorId: z.string(),
  creditorId: z.string(),
  amount: z.number(),
  day: z.string()
})

export const createPaybacksRoutes = (paybacks: PaybackRepository, view: SlateView) => {
  const createPaybackUseCase = createPayback(paybacks, view)
  const deletePaybackUseCase = deletePayback(paybacks, view)
  const updatePaybackUseCase = updatePayback(paybacks, view)

  return new Hono<{ Variables: { userId: string; userName: string } }>()
    .post('/:groupId/paybacks', validateBody(paybackBody), async c => {
      const group = await createPaybackUseCase.execute(
        c.get('userId'),
        c.req.param('groupId'),
        c.req.valid('json')
      )
      return c.json(group, 201)
    })
    .patch('/:groupId/paybacks/:id', validateBody(paybackBody), async c =>
      c.json(
        await updatePaybackUseCase.execute(
          c.get('userId'),
          c.req.param('groupId'),
          c.req.param('id'),
          c.req.valid('json')
        )
      )
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
