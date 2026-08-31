export type PaybackBalance = {
  userId: string
  name: string
  amount: number
}

export type EditedPayback = {
  debtorId: string
  creditorId: string
  amount: number
}

// The Slate Balances include the Payback being edited; on edit the cap and the
// creditor list are re-derived without it, so a Payback at the cap stays
// editable. Create passes null and reads the raw Balances. The server stays
// the authority and re-validates on submit — this is a preview projection of
// the Balances already shipped in the Slate DTO.
const balanceWithout = (
  balances: PaybackBalance[],
  editedPayback: EditedPayback | null,
  memberId: string
): number => {
  const balance = balances.find(balance => balance.userId === memberId)?.amount ?? 0
  if (!editedPayback) return balance
  return (
    balance -
    (editedPayback.debtorId === memberId ? editedPayback.amount : 0) +
    (editedPayback.creditorId === memberId ? editedPayback.amount : 0)
  )
}

// The Members a selected Payback can credit: a positive Balance, most-owed
// first.
export const paybackCreditors = (
  balances: PaybackBalance[],
  editedPayback: EditedPayback | null
): PaybackBalance[] =>
  balances
    .map(balance => ({
      ...balance,
      amount: balanceWithout(balances, editedPayback, balance.userId)
    }))
    .filter(balance => balance.amount > 0)
    .sort((a, b) => b.amount - a.amount)

// The largest Amount a Payback can be for a chosen (debtor, creditor) pair.
// Floored at 0: a debtor who owes nothing has no headroom, not a negative cap.
export const paybackCap = (
  balances: PaybackBalance[],
  editedPayback: EditedPayback | null,
  debtorId: string,
  creditorId: string
): number =>
  Math.max(
    0,
    Math.min(
      -balanceWithout(balances, editedPayback, debtorId),
      balanceWithout(balances, editedPayback, creditorId)
    )
  )
