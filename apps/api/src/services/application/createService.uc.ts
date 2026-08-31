import type { SlateView } from '~/groups/application/getSlate.uc'
import { amountFromCents, invalidData } from '~/shared/domain'
import { serviceCreate } from '~/services/domain/service.entity'
import type { ServiceRepository } from '~/services/domain/service.repository'
import { dayFrom } from '~/shared/domain'
import { labelFrom } from '~/expenses/domain/label.vo'

export type CreateServiceInput = {
  label: string
  day: string
  amount: number
  providerId: string
  participantIds?: string[]
}

export const createService = (services: ServiceRepository, view: SlateView) => ({
  execute: async (userId: string, groupId: string, input: CreateServiceInput) => {
    const slate = await view.execute(userId, groupId)
    const memberIds = slate.members.map(member => member.userId)
    const participantIds = input.participantIds ?? memberIds
    if (
      !memberIds.includes(input.providerId) ||
      participantIds.some(id => !memberIds.includes(id))
    ) {
      throw invalidData('Membre introuvable')
    }
    const service = serviceCreate(
      groupId,
      labelFrom(input.label),
      dayFrom(input.day),
      amountFromCents(input.amount),
      input.providerId,
      participantIds
    )
    await services.save(service)
    return view.execute(userId, groupId)
  }
})
