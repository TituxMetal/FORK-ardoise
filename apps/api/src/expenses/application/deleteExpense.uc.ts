import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import type { SlateView } from '~/groups/application/getSlate.uc'
import { notFound } from '~/shared/domain'

export const deleteExpense = (expenses: ExpenseRepository, view: SlateView) => ({
  execute: async (userId: string, groupId: string, expenseId: string) => {
    await view.execute(userId, groupId)
    const expense = await expenses.findById(expenseId)
    if (!expense || expense.groupId !== groupId) {
      throw notFound('Dépense introuvable')
    }
    await expenses.delete(expenseId)
    return view.execute(userId, groupId)
  }
})
