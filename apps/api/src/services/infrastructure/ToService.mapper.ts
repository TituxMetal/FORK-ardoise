import { dayReconstitute } from '../../expenses/domain/Day.vo.ts'
import { labelReconstitute } from '../../expenses/domain/Label.vo.ts'
import { amountReconstitute } from '../../domain/Amount.ts'
import { Service } from '../domain/Service.entity.ts'

export const toService = (row: {
  id: string
  groupeId: string
  label: string
  day: string
  amount: number
  providerId: string
  participants: { userId: string; ordinal: number }[]
  parts: { userId: string; amount: number; ordinal: number }[]
}) => {
  const participants = [...row.participants].sort((a, b) => a.ordinal - b.ordinal)
  const parts = [...row.parts].sort((a, b) => a.ordinal - b.ordinal)
  return Service.reconstitute(
    row.id,
    row.groupeId,
    labelReconstitute(row.label),
    dayReconstitute(row.day),
    amountReconstitute(row.amount),
    row.providerId,
    participants.map(participant => participant.userId),
    parts.map(part => ({
      userId: part.userId,
      amount: amountReconstitute(part.amount)
    }))
  )
}
