import { amountReconstitute, dayReconstitute } from '~/shared/domain'
import { paybackReconstitute } from '../domain'

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
