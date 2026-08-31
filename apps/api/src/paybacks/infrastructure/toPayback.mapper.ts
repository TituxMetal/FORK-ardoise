import { amountReconstitute, dayReconstitute } from '~/shared/domain'
import { paybackReconstitute } from '~/paybacks/domain/payback.entity'

export const toPayback = (row: {
  id: string
  groupId: string
  debtorId: string
  creditorId: string
  day: string
  amount: number
}) =>
  paybackReconstitute(
    row.id,
    row.groupId,
    row.debtorId,
    row.creditorId,
    dayReconstitute(row.day),
    amountReconstitute(row.amount)
  )
