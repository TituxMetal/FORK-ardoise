import { amountReconstitute } from '../../domain/Amount.ts'
import { paybackReconstitute } from '../domain/Payback.entity.ts'

export const toPayback = (row: {
  id: string
  groupId: string
  debtorId: string
  creditorId: string
  amount: number
}) =>
  paybackReconstitute(
    row.id,
    row.groupId,
    row.debtorId,
    row.creditorId,
    amountReconstitute(row.amount)
  )
