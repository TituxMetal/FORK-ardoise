import type { SlateView } from '~/groups/application/getSlate.uc'
import { paybackUpdate } from '~/paybacks/domain/payback.entity'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'
import { amountFromCents, invalidData, notFound } from '~/shared/domain'

export type UpdatePaybackInput = {
  debtorId: string
  creditorId: string
  amount: number
}

export const updatePayback = (paybacks: PaybackRepository, view: SlateView) => ({
  execute: async (
    userId: string,
    groupId: string,
    paybackId: string,
    input: UpdatePaybackInput
  ) => {
    // The slate snapshot is authoritative: its Balances, Members and Paybacks
    // come from the same read, so the cap baseline cannot mix two moments.
    const slate = await view.execute(userId, groupId)
    const payback = slate.paybacks.find(payback => payback.id === paybackId)
    if (!payback) {
      throw notFound('Règlement introuvable')
    }
    if (
      !slate.members.some(member => member.userId === input.debtorId) ||
      !slate.members.some(member => member.userId === input.creditorId)
    ) {
      throw invalidData('Membre introuvable')
    }
    // The slate Balances include the Payback being edited; the cap rule must
    // see them without it, so a Payback at the cap stays editable.
    const withoutEdited = (memberId: string) => {
      const amount = slate.balances.find(balance => balance.userId === memberId)?.amount ?? 0
      return (
        amount -
        (payback.debtorId === memberId ? payback.amount : 0) +
        (payback.creditorId === memberId ? payback.amount : 0)
      )
    }
    const updated = paybackUpdate(
      payback.id,
      groupId,
      input.debtorId,
      input.creditorId,
      amountFromCents(input.amount),
      withoutEdited(input.debtorId),
      withoutEdited(input.creditorId)
    )
    await paybacks.update(updated)
    return view.execute(userId, groupId)
  }
})
