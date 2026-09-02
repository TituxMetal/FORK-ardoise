import { Hono } from 'hono'
import { z } from 'zod'
import { validateBody } from '~/shared/presentation'
import type { SlateView } from '~/groups/application'
import { serviceMutation } from '../application'
import type { ServiceRepository } from '../domain'

const serviceBody = z.object({
  label: z.string(),
  day: z.string(),
  amount: z.number(),
  providerId: z.string(),
  participantIds: z.array(z.string()).optional()
})

export const createServicesRoutes = (services: ServiceRepository, view: SlateView) => {
  const mutation = serviceMutation(services, view)

  return new Hono<{ Variables: { userId: string; userName: string } }>()
    .post('/:groupId/services', validateBody(serviceBody), async c => {
      const group = await mutation.create.execute(
        c.get('userId'),
        c.req.param('groupId'),
        c.req.valid('json')
      )
      return c.json(group, 201)
    })
    .patch('/:groupId/services/:id', validateBody(serviceBody), async c =>
      c.json(
        await mutation.update.execute(
          c.get('userId'),
          c.req.param('groupId'),
          c.req.param('id'),
          c.req.valid('json')
        )
      )
    )
    .delete('/:groupId/services/:id', async c =>
      c.json(
        await mutation.delete.execute(c.get('userId'), c.req.param('groupId'), c.req.param('id'))
      )
    )
}
