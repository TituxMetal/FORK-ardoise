import type { Depense } from './Depense.entity.ts'

export const IExpenseRepository = Symbol('IExpenseRepository')

export type IExpenseRepository = {
  save: (depense: Depense) => Promise<void>
  findById: (id: string) => Promise<Depense | null>
  findByGroupeId: (groupeId: string) => Promise<Depense[]>
  delete: (id: string) => Promise<void>
}
