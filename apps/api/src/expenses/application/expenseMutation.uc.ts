import { type SlateView, slateMutation, type SlateMutation } from '~/groups/application'
import {
  expenseCreate,
  expenseUpdate,
  type Expense,
  labelFrom,
  type ExpenseRepository
} from '../domain'
import { amountFromCents, dayFrom } from '~/shared/domain'

export type ExpenseInput = {
  label: string
  day: string
  amount: number
  payerId: string
  participantIds?: string[]
}

export const expenseMutation = (
  expenses: ExpenseRepository,
  view: SlateView
): SlateMutation<ExpenseInput> =>
  slateMutation<ExpenseInput, Expense>(view, {
    noun: 'Dépense',
    // An omitted Participant list defaults to every Member (create) or keeps
    // the existing split (update); the edit form always sends it.
    referencedMemberIds: (input, slate, existing) => {
      const participantIds =
        input.participantIds ??
        (existing ? existing.participantIds : slate.members.map(member => member.userId))
      return [input.payerId, ...participantIds]
    },
    load: expenses.findById,
    buildCreate: (slate, groupId, input) => {
      const participantIds = input.participantIds ?? slate.members.map(member => member.userId)
      return expenseCreate(
        groupId,
        labelFrom(input.label),
        dayFrom(input.day),
        amountFromCents(input.amount),
        input.payerId,
        participantIds
      )
    },
    buildUpdate: (_slate, groupId, input, existing) => {
      const participantIds = input.participantIds ?? existing.participantIds
      return expenseUpdate(
        existing.id,
        groupId,
        labelFrom(input.label),
        dayFrom(input.day),
        amountFromCents(input.amount),
        input.payerId,
        participantIds
      )
    },
    persist: {
      create: expenses.save,
      update: expenses.update,
      delete: expenses.delete
    }
  })
