import type { SlateView } from '~/groups/application/getSlate.uc'
import { notFound } from '~/shared/domain'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'

export const deletePayback = (paybacks: PaybackRepository, view: SlateView) => ({
  execute: async (userId: string, groupId: string, paybackId: string) => {
    await view.execute(userId, groupId)
    const payback = await paybacks.findById(paybackId)
    if (!payback || payback.groupId !== groupId) {
      throw notFound('Règlement introuvable')
    }
    await paybacks.delete(paybackId)
    return view.execute(userId, groupId)
  }
})
