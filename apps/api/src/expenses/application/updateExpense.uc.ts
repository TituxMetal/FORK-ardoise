import { dayFrom } from '~/expenses/domain/day.vo'
import { labelFrom } from '~/expenses/domain/label.vo'
import { expenseUpdate } from '~/expenses/domain/expense.entity'
import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { amountFromCents, invalidData, notFound } from '~/shared/domain'
import type { SlateView } from '~/groups/application/getSlate.uc'

export type UpdateExpenseInput = {
  label: string
  day: string
  amount: number
  payerId: string
  participantIds?: string[]
}

export const updateExpense = (expenses: ExpenseRepository, view: SlateView) => ({
  execute: async (
    userId: string,
    groupId: string,
    expenseId: string,
    input: UpdateExpenseInput
  ) => {
    const slate = await view.execute(userId, groupId)
    const expense = await expenses.findById(expenseId)
    if (!expense || expense.groupId !== groupId) {
      throw notFound('Dépense introuvable')
    }
    const memberIds = slate.members.map(member => member.userId)
    // An omitted Participant list keeps the existing split; the edit form
    // always sends it.
    const participantIds = input.participantIds ?? expense.participantIds
    if (!memberIds.includes(input.payerId) || participantIds.some(id => !memberIds.includes(id))) {
      throw invalidData('Membre introuvable')
    }
    const updated = expenseUpdate(
      expense.id,
      groupId,
      labelFrom(input.label),
      dayFrom(input.day),
      amountFromCents(input.amount),
      input.payerId,
      participantIds
    )
    await expenses.update(updated)
    return view.execute(userId, groupId)
  }
})
