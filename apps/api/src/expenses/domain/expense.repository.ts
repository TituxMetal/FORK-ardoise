import type { Expense } from '~/expenses/domain/expense.entity'

export type ExpenseRepository = {
  save: (expense: Expense) => Promise<void>
  findById: (id: string) => Promise<Expense | null>
  findByGroupId: (groupId: string) => Promise<Expense[]>
  /** Replaces an existing Expense and its split; the caller validated membership and the domain rule. */
  update: (expense: Expense) => Promise<void>
  delete: (id: string) => Promise<void>
}
