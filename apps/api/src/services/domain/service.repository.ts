import type { Service } from '~/services/domain/service.entity'

export const ServiceRepository = Symbol('ServiceRepository')

export type ServiceRepository = {
  save: (service: Service) => Promise<void>
  findById: (id: string) => Promise<Service | null>
  findByGroupId: (groupId: string) => Promise<Service[]>
  delete: (id: string) => Promise<void>
}
