import type { Day } from '~/expenses/domain/day.vo'
import type { Label } from '~/expenses/domain/label.vo'
import { type Amount, equalParts, type Part } from '~/shared/domain'

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
