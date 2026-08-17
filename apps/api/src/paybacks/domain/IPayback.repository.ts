import type { Payback } from './Payback.entity.ts'

export const IPaybackRepository = Symbol('IPaybackRepository')

export type IPaybackRepository = {
  save: (payback: Payback) => Promise<void>
  findById: (id: string) => Promise<Payback | null>
  findByGroupeId: (groupeId: string) => Promise<Payback[]>
  delete: (id: string) => Promise<void>
}
