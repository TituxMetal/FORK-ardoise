import type { SlateView } from '~/groups/application/getSlate.uc'
import { amountFromCents, invalidData } from '~/shared/domain'
import { serviceUpdate } from '~/services/domain/service.entity'
import type { ServiceRepository } from '~/services/domain/service.repository'
import { dayFrom } from '~/shared/domain'
import { labelFrom } from '~/expenses/domain/label.vo'
import { notFound } from '~/shared/domain'

export type UpdateServiceInput = {
  label: string
  day: string
  amount: number
  providerId: string
  participantIds?: string[]
}

export const updateService = (services: ServiceRepository, view: SlateView) => ({
  execute: async (
    userId: string,
    groupId: string,
    serviceId: string,
    input: UpdateServiceInput
  ) => {
    const slate = await view.execute(userId, groupId)
    const service = await services.findById(serviceId)
    if (!service || service.groupId !== groupId) {
      throw notFound('Service introuvable')
    }
    const memberIds = slate.members.map(member => member.userId)
    // An omitted Participant list keeps the existing split; the edit form
    // always sends it.
    const participantIds = input.participantIds ?? service.participantIds
    if (
      !memberIds.includes(input.providerId) ||
      participantIds.some(id => !memberIds.includes(id))
    ) {
      throw invalidData('Membre introuvable')
    }
    const updated = serviceUpdate(
      service.id,
      groupId,
      labelFrom(input.label),
      dayFrom(input.day),
      amountFromCents(input.amount),
      input.providerId,
      participantIds
    )
    await services.update(updated)
    return view.execute(userId, groupId)
  }
})
