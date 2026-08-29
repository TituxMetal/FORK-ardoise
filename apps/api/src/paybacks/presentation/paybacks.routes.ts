import { Hono } from 'hono'
import { z } from 'zod'
import { validateBody } from '~/shared/presentation'
import type { SlateView } from '~/groups/application/getSlate.uc'
import { createPayback } from '~/paybacks/application/createPayback.uc'
import { deletePayback } from '~/paybacks/application/deletePayback.uc'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'

const createPaybackBody = z.object({
  debtorId: z.string(),
  creditorId: z.string(),
  amount: z.number()
})

export const createPaybacksRoutes = (paybacks: PaybackRepository, view: SlateView) => {
  const createPaybackUseCase = createPayback(paybacks, view)
  const deletePaybackUseCase = deletePayback(paybacks, view)

  return new Hono<{ Variables: { userId: string; userName: string } }>()
    .post('/:groupId/paybacks', validateBody(createPaybackBody), async c => {
      const group = await createPaybackUseCase.execute(
        c.get('userId'),
        c.req.param('groupId'),
        c.req.valid('json')
      )
      return c.json(group, 201)
    })
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
