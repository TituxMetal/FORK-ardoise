import { amountReconstitute } from '../../domain/Amount.ts'
import { dayReconstitute } from '../domain/Day.vo.ts'
import { expenseReconstitute } from '../domain/Expense.entity.ts'
import { labelReconstitute } from '../domain/Label.vo.ts'

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
