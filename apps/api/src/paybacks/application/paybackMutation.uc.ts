import type { SlateView } from '~/groups/application/getSlate.uc'
import { slateMutation, type SlateMutation } from '~/groups/application/slateMutation.uc'
import {
  paybackCreate,
  paybackReconstitute,
  paybackUpdate,
  type Payback
} from '~/paybacks/domain/payback.entity'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'
import { amountFromCents, amountReconstitute, dayFrom, dayReconstitute } from '~/shared/domain'

export type PaybackInput = {
  debtorId: string
  creditorId: string
  amount: number
  day: string
}

export const paybackMutation = (
  paybacks: PaybackRepository,
  view: SlateView
): SlateMutation<PaybackInput> =>
  slateMutation<PaybackInput, Payback>(view, {
    noun: 'Règlement',
    referencedMemberIds: input => [input.debtorId, input.creditorId],
    // The edited Payback is read from the slate snapshot (not the repository),
    // so the cap baseline and the edited amount describe the same read — a
    // concurrent edit cannot mix two versions.
    load: async (id, slate) => {
      const dto = slate.paybacks.find(payback => payback.id === id)
      return dto
        ? paybackReconstitute(
            dto.id,
            slate.id,
            dto.debtorId,
            dto.creditorId,
            dayReconstitute(dto.day),
            amountReconstitute(dto.amount)
          )
        : null
    },
    buildCreate: (slate, groupId, input) => {
      const debtorBalance =
        slate.balances.find(balance => balance.userId === input.debtorId)?.amount ?? 0
      const creditorBalance =
        slate.balances.find(balance => balance.userId === input.creditorId)?.amount ?? 0
      return paybackCreate(
        groupId,
        input.debtorId,
        input.creditorId,
        dayFrom(input.day),
        amountFromCents(input.amount),
        debtorBalance,
        creditorBalance
      )
    },
    buildUpdate: (slate, groupId, input, existing) => {
      // The slate Balances include the Payback being edited; the cap rule must
      // see them without it, so a Payback at the cap stays editable.
      const withoutEdited = (memberId: string) => {
        const amount = slate.balances.find(balance => balance.userId === memberId)?.amount ?? 0
        return (
          amount -
          (existing.debtorId === memberId ? existing.amount.value : 0) +
          (existing.creditorId === memberId ? existing.amount.value : 0)
        )
      }
      return paybackUpdate(
        existing.id,
        groupId,
        input.debtorId,
        input.creditorId,
        dayFrom(input.day),
        amountFromCents(input.amount),
        withoutEdited(input.debtorId),
        withoutEdited(input.creditorId)
      )
    },
    persist: {
      create: paybacks.save,
      update: paybacks.update,
      delete: paybacks.delete
    }
  })
