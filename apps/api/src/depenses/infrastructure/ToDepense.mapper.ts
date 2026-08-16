import { amountReconstitute } from '../../domain/Amount.ts'
import { Depense } from '../domain/Depense.entity.ts'
import { Jour } from '../domain/Jour.vo.ts'
import { Libelle } from '../domain/Libelle.vo.ts'

export const toDepense = (row: {
  id: string
  groupeId: string
  label: string
  day: string
  amount: number
  payerId: string
  participants: { userId: string; ordinal: number }[]
  parts: { userId: string; amount: number; ordinal: number }[]
}) => {
  const participants = [...row.participants].sort((a, b) => a.ordinal - b.ordinal)
  const parts = [...row.parts].sort((a, b) => a.ordinal - b.ordinal)
  return Depense.reconstitute(
    row.id,
    row.groupeId,
    Libelle.reconstitute(row.label),
    Jour.reconstitute(row.day),
    amountReconstitute(row.amount),
    row.payerId,
    participants.map(participant => participant.userId),
    parts.map(part => ({
      userId: part.userId,
      amount: amountReconstitute(part.amount)
    }))
  )
}
