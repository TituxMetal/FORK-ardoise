import type { SlateView } from '~/groups/application/getSlate.uc'
import { slateMutation, type SlateMutation } from '~/groups/application/slateMutation.uc'
import { serviceCreate, serviceUpdate, type Service } from '~/services/domain/service.entity'
import type { ServiceRepository } from '~/services/domain/service.repository'
import { labelFrom } from '~/expenses/domain/label.vo'
import { amountFromCents, dayFrom } from '~/shared/domain'

export type ServiceInput = {
  label: string
  day: string
  amount: number
  providerId: string
  participantIds?: string[]
}

export const serviceMutation = (
  services: ServiceRepository,
  view: SlateView
): SlateMutation<ServiceInput> =>
  slateMutation<ServiceInput, Service>(view, {
    noun: 'Service',
    // An omitted Participant list defaults to every Member (create) or keeps
    // the existing split (update); the edit form always sends it.
    referencedMemberIds: (input, slate, existing) => {
      const participantIds =
        input.participantIds ??
        (existing ? existing.participantIds : slate.members.map(member => member.userId))
      return [input.providerId, ...participantIds]
    },
    load: services.findById,
    buildCreate: (slate, groupId, input) => {
      const participantIds = input.participantIds ?? slate.members.map(member => member.userId)
      return serviceCreate(
        groupId,
        labelFrom(input.label),
        dayFrom(input.day),
        amountFromCents(input.amount),
        input.providerId,
        participantIds
      )
    },
    buildUpdate: (_slate, groupId, input, existing) => {
      const participantIds = input.participantIds ?? existing.participantIds
      return serviceUpdate(
        existing.id,
        groupId,
        labelFrom(input.label),
        dayFrom(input.day),
        amountFromCents(input.amount),
        input.providerId,
        participantIds
      )
    },
    persist: {
      create: services.save,
      update: services.update,
      delete: services.delete
    }
  })
