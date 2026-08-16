import type { Reglement } from './Reglement.entity.ts'

export const IReglementRepository = Symbol('IReglementRepository')

export type IReglementRepository = {
  save: (reglement: Reglement) => Promise<void>
  findById: (id: string) => Promise<Reglement | null>
  findByGroupeId: (groupeId: string) => Promise<Reglement[]>
  delete: (id: string) => Promise<void>
}
