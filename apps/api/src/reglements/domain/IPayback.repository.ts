import type { Reglement } from './Reglement.entity.ts'

export const IPaybackRepository = Symbol('IPaybackRepository')

export type IPaybackRepository = {
  save: (reglement: Reglement) => Promise<void>
  findById: (id: string) => Promise<Reglement | null>
  findByGroupeId: (groupeId: string) => Promise<Reglement[]>
  delete: (id: string) => Promise<void>
}
