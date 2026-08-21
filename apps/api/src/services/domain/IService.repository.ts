import type { Service } from '~/services/domain/Service.entity'

export const IServiceRepository = Symbol('IServiceRepository')

export type IServiceRepository = {
  save: (service: Service) => Promise<void>
  findById: (id: string) => Promise<Service | null>
  findByGroupId: (groupId: string) => Promise<Service[]>
  delete: (id: string) => Promise<void>
}
