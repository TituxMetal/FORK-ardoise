import { amountReconstitute } from '~/domain/Amount'
import { paybackReconstitute } from '~/paybacks/domain/Payback.entity'

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
