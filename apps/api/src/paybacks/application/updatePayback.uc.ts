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
    const slate = await view.execute(userId, groupId)
    const payback = await paybacks.findById(paybackId)
    if (!payback || payback.groupId !== groupId) {
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
        (payback.debtorId === memberId ? payback.amount.value : 0) +
        (payback.creditorId === memberId ? payback.amount.value : 0)
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
