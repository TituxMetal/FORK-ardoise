import { type Day, type Amount, equalParts, type Part } from '~/shared/domain'
import type { Label } from '~/expenses/domain'

export type Service = {
  id: string
  groupId: string
  label: Label
  day: Day
  amount: Amount
  providerId: string
  participantIds: string[]
  parts: Part[]
}

export const serviceCreate = (
  groupId: string,
  label: Label,
  day: Day,
  amount: Amount,
  providerId: string,
  participantIds: string[]
): Service => ({
  id: crypto.randomUUID(),
  groupId,
  label,
  day,
  amount,
  providerId,
  participantIds,
  parts: equalParts(amount, participantIds, providerId)
})

export const serviceReconstitute = (
  id: string,
  groupId: string,
  label: Label,
  day: Day,
  amount: Amount,
  providerId: string,
  participantIds: string[],
  parts: Part[]
): Service => ({ id, groupId, label, day, amount, providerId, participantIds, parts })
// An edit keeps the id and re-derives the equal split from the new fields;
// the caller validated membership against the Slate first.
export const serviceUpdate = (
  id: string,
  groupId: string,
  label: Label,
  day: Day,
  amount: Amount,
  providerId: string,
  participantIds: string[]
): Service => ({
  id,
  groupId,
  label,
  day,
  amount,
  providerId,
  participantIds,
  parts: equalParts(amount, participantIds, providerId)
})
