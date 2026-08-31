import type { SlateView } from '~/groups/application/getSlate.uc'
import { dayFrom } from '~/shared/domain'
import { paybackCreate } from '~/paybacks/domain/payback.entity'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'
import { amountFromCents, invalidData } from '~/shared/domain'

export type CreatePaybackInput = {
  debtorId: string
  creditorId: string
  amount: number
  day: string
}

export const createPayback = (paybacks: PaybackRepository, view: SlateView) => ({
  execute: async (userId: string, groupId: string, input: CreatePaybackInput) => {
    const slate = await view.execute(userId, groupId)
    if (
      !slate.members.some(member => member.userId === input.debtorId) ||
      !slate.members.some(member => member.userId === input.creditorId)
    ) {
      throw invalidData('Membre introuvable')
    }
    const debtorBalance =
      slate.balances.find(balance => balance.userId === input.debtorId)?.amount ?? 0
    const creditorBalance =
      slate.balances.find(balance => balance.userId === input.creditorId)?.amount ?? 0
    const payback = paybackCreate(
      groupId,
      input.debtorId,
      input.creditorId,
      dayFrom(input.day),
      amountFromCents(input.amount),
      debtorBalance,
      creditorBalance
    )
    await paybacks.save(payback)
    return view.execute(userId, groupId)
  }
})
