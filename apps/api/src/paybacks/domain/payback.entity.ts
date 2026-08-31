import { invalidData, type Amount } from '~/shared/domain'
import type { Day } from '~/shared/domain'

export type Payback = {
  id: string
  groupId: string
  debtorId: string
  creditorId: string
  day: Day
  amount: Amount
}

export const PAYBACK_ABOVE_CAP = 'Montant au-dessus du plafond'
export const PAYBACK_DEBTOR_NOT_NEGATIVE = 'Débiteur au Solde non négatif'
export const PAYBACK_CREDITOR_NOT_POSITIVE = 'Créancier au Solde non positif'

export const paybackCap = (debtorBalance: number, creditorBalance: number) =>
  Math.min(-debtorBalance, creditorBalance)

// Create and update share the cap rule; only the id assignment differs.
const paybackValidated = (
  groupId: string,
  debtorId: string,
  creditorId: string,
  day: Day,
  amount: Amount,
  debtorBalance: number,
  creditorBalance: number
): Omit<Payback, 'id'> => {
  if (debtorBalance >= 0) {
    throw invalidData(PAYBACK_DEBTOR_NOT_NEGATIVE)
  }
  if (creditorBalance <= 0) {
    throw invalidData(PAYBACK_CREDITOR_NOT_POSITIVE)
  }
  const cap = paybackCap(debtorBalance, creditorBalance)
  if (amount.value > cap) {
    throw invalidData(PAYBACK_ABOVE_CAP)
  }
  return { groupId, debtorId, creditorId, day, amount }
}

export const paybackCreate = (
  groupId: string,
  debtorId: string,
  creditorId: string,
  day: Day,
  amount: Amount,
  debtorBalance: number,
  creditorBalance: number
): Payback => ({
  id: crypto.randomUUID(),
  ...paybackValidated(groupId, debtorId, creditorId, day, amount, debtorBalance, creditorBalance)
})

// An edit re-validates against the Balances without the Payback being edited
// and keeps the id, so a Payback at the cap stays editable.
export const paybackUpdate = (
  id: string,
  groupId: string,
  debtorId: string,
  creditorId: string,
  day: Day,
  amount: Amount,
  debtorBalance: number,
  creditorBalance: number
): Payback => ({
  id,
  ...paybackValidated(groupId, debtorId, creditorId, day, amount, debtorBalance, creditorBalance)
})

export const paybackReconstitute = (
  id: string,
  groupId: string,
  debtorId: string,
  creditorId: string,
  day: Day,
  amount: Amount
): Payback => ({ id, groupId, debtorId, creditorId, day, amount })
