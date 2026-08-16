import { Montant } from '../../domain/Montant.vo.ts'
import { Reglement } from '../domain/Reglement.entity.ts'

export const toReglement = (row: {
  id: string
  groupeId: string
  debtorId: string
  creditorId: string
  amount: number
}) =>
  Reglement.reconstitute(
    row.id,
    row.groupeId,
    row.debtorId,
    row.creditorId,
    Montant.reconstitute(row.amount)
  )
