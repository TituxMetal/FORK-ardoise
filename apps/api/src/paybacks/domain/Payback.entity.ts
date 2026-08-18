import { invalidData } from '../../domain/invalidData.ts'
import type { Amount } from '../../domain/Amount.ts'

export type Payback = {
  id: string
  groupId: string
  debtorId: string
  creditorId: string
  amount: Amount
}

export const PAYBACK_ABOVE_CAP = 'Montant au-dessus du plafond'
export const PAYBACK_DEBTOR_NOT_NEGATIVE = 'Débiteur au Solde non négatif'
export const PAYBACK_CREDITOR_NOT_POSITIVE = 'Créancier au Solde non positif'

export const paybackCap = (debtorBalance: number, creditorBalance: number) =>
  Math.min(-debtorBalance, creditorBalance)

export const paybackCreate = (
  groupId: string,
  debtorId: string,
  creditorId: string,
  amount: Amount,
  debtorBalance: number,
  creditorBalance: number
): Payback => {
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
  return { id: crypto.randomUUID(), groupId, debtorId, creditorId, amount }
}

export const paybackReconstitute = (
  id: string,
  groupId: string,
  debtorId: string,
  creditorId: string,
  amount: Amount
): Payback => ({ id, groupId, debtorId, creditorId, amount })
