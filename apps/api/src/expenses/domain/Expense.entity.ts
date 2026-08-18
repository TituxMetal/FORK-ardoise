import type { Amount } from '../../domain/Amount.ts'
import { equalParts, type Part } from '../../domain/Part.ts'
import type { Day } from './Day.vo.ts'
import type { Label } from './Label.vo.ts'

export type Expense = {
  id: string
  groupId: string
  label: Label
  day: Day
  amount: Amount
  payerId: string
  participantIds: string[]
  parts: Part[]
}

export const expenseCreate = (
  groupId: string,
  label: Label,
  day: Day,
  amount: Amount,
  payerId: string,
  participantIds: string[]
): Expense => ({
  id: crypto.randomUUID(),
  groupId,
  label,
  day,
  amount,
  payerId,
  participantIds,
  parts: equalParts(amount, participantIds, payerId)
})

export const expenseReconstitute = (
  id: string,
  groupId: string,
  label: Label,
  day: Day,
  amount: Amount,
  payerId: string,
  participantIds: string[],
  parts: Part[]
): Expense => ({ id, groupId, label, day, amount, payerId, participantIds, parts })
