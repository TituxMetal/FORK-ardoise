import { type Amount, equalParts, type Part, type Day } from '~/shared/domain'
import type { Label } from './label.vo'

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
// An edit keeps the id and re-derives the equal split from the new fields;
// the caller validated membership against the Slate first.
export const expenseUpdate = (
  id: string,
  groupId: string,
  label: Label,
  day: Day,
  amount: Amount,
  payerId: string,
  participantIds: string[]
): Expense => ({
  id,
  groupId,
  label,
  day,
  amount,
  payerId,
  participantIds,
  parts: equalParts(amount, participantIds, payerId)
})
