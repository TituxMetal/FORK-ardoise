import { dayFrom } from '~/expenses/domain/day.vo'
import { labelFrom } from '~/expenses/domain/label.vo'
import { expenseCreate } from '~/expenses/domain/expense.entity'
import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { amountFromCents, invalidData } from '~/shared/domain'
import type { SlateView } from '~/groups/application/getSlate.uc'

export type CreateExpenseInput = {
  label: string
  day: string
  amount: number
  payerId: string
  participantIds?: string[]
}

export const createExpense = (expenses: ExpenseRepository, view: SlateView) => ({
  execute: async (userId: string, groupId: string, input: CreateExpenseInput) => {
    const slate = await view.execute(userId, groupId)
    const memberIds = slate.members.map(member => member.userId)
    const participantIds = input.participantIds ?? memberIds
    if (!memberIds.includes(input.payerId) || participantIds.some(id => !memberIds.includes(id))) {
      throw invalidData('Membre introuvable')
    }
    const expense = expenseCreate(
      groupId,
      labelFrom(input.label),
      dayFrom(input.day),
      amountFromCents(input.amount),
      input.payerId,
      participantIds
    )
    await expenses.save(expense)
    return view.execute(userId, groupId)
  }
})
