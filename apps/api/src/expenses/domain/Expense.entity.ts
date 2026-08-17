import type { Amount } from '../../domain/Amount.ts'
import { equalParts, type Part } from '../../domain/Part.ts'
import type { Day } from './Day.vo.ts'
import type { Label } from './Label.vo.ts'

export type Expense = {
  id: string
  groupeId: string
  label: Label
  day: Day
  amount: Amount
  payerId: string
  participantIds: string[]
  parts: Part[]
}

export const expenseCreate = (
  groupeId: string,
  label: Label,
  day: Day,
  amount: Amount,
  payerId: string,
  participantIds: string[]
): Expense => ({
  id: crypto.randomUUID(),
  groupeId,
  label,
  day,
  amount,
  payerId,
  participantIds,
  parts: equalParts(amount, participantIds, payerId)
})

export const expenseReconstitute = (
  id: string,
  groupeId: string,
  label: Label,
  day: Day,
  amount: Amount,
  payerId: string,
  participantIds: string[],
  parts: Part[]
): Expense => ({ id, groupeId, label, day, amount, payerId, participantIds, parts })
