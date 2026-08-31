import { Hono } from 'hono'
import { z } from 'zod'
import { validateBody } from '~/shared/presentation'
import type { SlateView } from '~/groups/application/getSlate.uc'
import { createService } from '~/services/application/createService.uc'
import { deleteService } from '~/services/application/deleteService.uc'
import { updateService } from '~/services/application/updateService.uc'
import type { ServiceRepository } from '~/services/domain/service.repository'

const serviceBody = z.object({
  label: z.string(),
  day: z.string(),
  amount: z.number(),
  providerId: z.string(),
  participantIds: z.array(z.string()).optional()
})

export const createServicesRoutes = (services: ServiceRepository, view: SlateView) => {
  const createServiceUseCase = createService(services, view)
  const deleteServiceUseCase = deleteService(services, view)
  const updateServiceUseCase = updateService(services, view)

  return new Hono<{ Variables: { userId: string; userName: string } }>()
    .post('/:groupId/services', validateBody(serviceBody), async c => {
      const group = await createServiceUseCase.execute(
        c.get('userId'),
        c.req.param('groupId'),
        c.req.valid('json')
      )
      return c.json(group, 201)
    })
    .patch('/:groupId/services/:id', validateBody(serviceBody), async c =>
      c.json(
        await updateServiceUseCase.execute(
          c.get('userId'),
          c.req.param('groupId'),
          c.req.param('id'),
          c.req.valid('json')
        )
      )
    )
    .delete('/:groupId/services/:id', async c =>
      c.json(
        await deleteServiceUseCase.execute(
          c.get('userId'),
          c.req.param('groupId'),
          c.req.param('id')
        )
      )
    )
}
