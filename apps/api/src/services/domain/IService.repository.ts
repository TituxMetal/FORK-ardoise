import type { Service } from './Service.entity.ts'

export const IServiceRepository = Symbol('IServiceRepository')

export type IServiceRepository = {
  save: (service: Service) => Promise<void>
  findById: (id: string) => Promise<Service | null>
  findByGroupeId: (groupeId: string) => Promise<Service[]>
  delete: (id: string) => Promise<void>
}
