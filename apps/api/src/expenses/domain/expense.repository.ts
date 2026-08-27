import type { Expense } from '~/expenses/domain/expense.entity'

export type ExpenseRepository = {
  save: (expense: Expense) => Promise<void>
  findById: (id: string) => Promise<Expense | null>
  findByGroupId: (groupId: string) => Promise<Expense[]>
  delete: (id: string) => Promise<void>
}
