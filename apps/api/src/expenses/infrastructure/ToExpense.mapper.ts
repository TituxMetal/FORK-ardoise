import { amountReconstitute } from '~/domain/Amount'
import { dayReconstitute } from '~/expenses/domain/Day.vo'
import { expenseReconstitute } from '~/expenses/domain/Expense.entity'
import { labelReconstitute } from '~/expenses/domain/Label.vo'

export const toExpense = (row: {
  id: string
  groupId: string
  label: string
  day: string
  amount: number
  payerId: string
  participants: { userId: string; ordinal: number }[]
  parts: { userId: string; amount: number; ordinal: number }[]
}) => {
  const participants = [...row.participants].sort((a, b) => a.ordinal - b.ordinal)
  const parts = [...row.parts].sort((a, b) => a.ordinal - b.ordinal)
  return expenseReconstitute(
    row.id,
    row.groupId,
    labelReconstitute(row.label),
    dayReconstitute(row.day),
    amountReconstitute(row.amount),
    row.payerId,
    participants.map(participant => participant.userId),
    parts.map(part => ({
      userId: part.userId,
      amount: amountReconstitute(part.amount)
    }))
  )
}
