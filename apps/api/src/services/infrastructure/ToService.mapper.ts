import { dayReconstitute } from '~/expenses/domain/Day.vo'
import { labelReconstitute } from '~/expenses/domain/Label.vo'
import { amountReconstitute } from '~/domain/Amount'
import { serviceReconstitute } from '~/services/domain/Service.entity'

export const toService = (row: {
  id: string
  groupId: string
  label: string
  day: string
  amount: number
  providerId: string
  participants: { userId: string; ordinal: number }[]
  parts: { userId: string; amount: number; ordinal: number }[]
}) => {
  const participants = [...row.participants].sort((a, b) => a.ordinal - b.ordinal)
  const parts = [...row.parts].sort((a, b) => a.ordinal - b.ordinal)
  return serviceReconstitute(
    row.id,
    row.groupId,
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
