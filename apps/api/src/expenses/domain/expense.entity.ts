import { type Amount, equalParts, type Part } from '~/shared/domain'

import type { Day } from '~/expenses/domain/day.vo'
import type { Label } from '~/expenses/domain/label.vo'

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
