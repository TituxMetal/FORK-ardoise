import { Hono } from 'hono'
import { z } from 'zod'
import { validateBody } from '~/shared/presentation'
import type { SlateView } from '~/groups/application'
import { paybackMutation } from '../application'
import type { PaybackRepository } from '../domain'

const paybackBody = z.object({
  debtorId: z.string(),
  creditorId: z.string(),
  amount: z.number(),
  day: z.string()
})

export const createPaybacksRoutes = (paybacks: PaybackRepository, view: SlateView) => {
  const mutation = paybackMutation(paybacks, view)

  return new Hono<{ Variables: { userId: string; userName: string } }>()
    .post('/:groupId/paybacks', validateBody(paybackBody), async c => {
      const group = await mutation.create.execute(
        c.get('userId'),
        c.req.param('groupId'),
        c.req.valid('json')
      )
      return c.json(group, 201)
    })
    .patch('/:groupId/paybacks/:id', validateBody(paybackBody), async c =>
      c.json(
        await mutation.update.execute(
          c.get('userId'),
          c.req.param('groupId'),
          c.req.param('id'),
          c.req.valid('json')
        )
      )
    )
    .delete('/:groupId/paybacks/:id', async c =>
      c.json(
        await mutation.delete.execute(c.get('userId'), c.req.param('groupId'), c.req.param('id'))
      )
    )
}
