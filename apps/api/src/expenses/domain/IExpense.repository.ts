import type { Expense } from './Expense.entity.ts'

export const IExpenseRepository = Symbol('IExpenseRepository')

export type IExpenseRepository = {
  save: (expense: Expense) => Promise<void>
  findById: (id: string) => Promise<Expense | null>
  findByGroupId: (groupId: string) => Promise<Expense[]>
  delete: (id: string) => Promise<void>
}
