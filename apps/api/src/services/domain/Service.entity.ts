import type { Day } from '../../expenses/domain/Day.vo.ts'
import type { Label } from '../../expenses/domain/Label.vo.ts'
import type { Amount } from '../../domain/Amount.ts'
import { equalParts, type Part } from '../../domain/Part.ts'

export type Service = {
  id: string
  groupeId: string
  label: Label
  day: Day
  amount: Amount
  providerId: string
  participantIds: string[]
  parts: Part[]
}

export const serviceCreate = (
  groupeId: string,
  label: Label,
  day: Day,
  amount: Amount,
  providerId: string,
  participantIds: string[]
): Service => ({
  id: crypto.randomUUID(),
  groupeId,
  label,
  day,
  amount,
  providerId,
  participantIds,
  parts: equalParts(amount, participantIds, providerId)
})

export const serviceReconstitute = (
  id: string,
  groupeId: string,
  label: Label,
  day: Day,
  amount: Amount,
  providerId: string,
  participantIds: string[],
  parts: Part[]
): Service => ({ id, groupeId, label, day, amount, providerId, participantIds, parts })
