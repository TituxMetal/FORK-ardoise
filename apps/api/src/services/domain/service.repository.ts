import type { Service } from './service.entity'

export const ServiceRepository = Symbol('ServiceRepository')

export type ServiceRepository = {
  save: (service: Service) => Promise<void>
  findById: (id: string) => Promise<Service | null>
  findByGroupId: (groupId: string) => Promise<Service[]>
  /** Replaces an existing Service and its split; the caller validated membership and the domain rule. */
  update: (service: Service) => Promise<void>
  delete: (id: string) => Promise<void>
}
