import type { SlateView } from '~/groups/application/getSlate.uc'
import { notFound } from '~/shared/domain'
import type { ServiceRepository } from '~/services/domain/service.repository'

export const deleteService = (services: ServiceRepository, view: SlateView) => ({
  execute: async (userId: string, groupId: string, serviceId: string) => {
    await view.execute(userId, groupId)
    const service = await services.findById(serviceId)
    if (!service || service.groupId !== groupId) {
      throw notFound('Service introuvable')
    }
    await services.delete(serviceId)
    return view.execute(userId, groupId)
  }
})
