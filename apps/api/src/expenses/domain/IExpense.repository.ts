import type { Expense } from '~/expenses/domain/Expense.entity'

export const IExpenseRepository = Symbol('IExpenseRepository')

export type IExpenseRepository = {
  save: (expense: Expense) => Promise<void>
  findById: (id: string) => Promise<Expense | null>
  findByGroupId: (groupId: string) => Promise<Expense[]>
  delete: (id: string) => Promise<void>
}
