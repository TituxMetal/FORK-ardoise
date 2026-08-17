import { amountReconstitute } from '../../domain/Amount.ts'
import { paybackReconstitute } from '../domain/Payback.entity.ts'

export const toPayback = (row: {
  id: string
  groupeId: string
  debtorId: string
  creditorId: string
  amount: number
}) =>
  paybackReconstitute(
    row.id,
    row.groupeId,
    row.debtorId,
    row.creditorId,
    amountReconstitute(row.amount)
  )
