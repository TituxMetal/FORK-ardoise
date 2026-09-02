import { dayReconstitute, amountReconstitute } from '~/shared/domain'
import { labelReconstitute } from '~/expenses/domain'
import { serviceReconstitute } from '../domain'

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
