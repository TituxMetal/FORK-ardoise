import { dayFrom } from '~/expenses/domain/Day.vo'
import { labelFrom } from '~/expenses/domain/Label.vo'
import type { IExpenseRepository } from '~/expenses/domain/IExpense.repository'
import { amountFromCents, invalidData, notFound } from '~/shared/domain'

import { toGroupDto } from '~/groups/application/ToGroup.mapper'
import { groupHasMember } from '~/groups/domain/Group.entity'
import type { IGroupRepository } from '~/groups/domain/IGroup.repository'
import type { IPaybackRepository } from '~/paybacks/domain/IPayback.repository'
import { serviceCreate } from '~/services/domain/Service.entity'
import type { IServiceRepository } from '~/services/domain/IService.repository'

export type CreateServiceInput = {
  label: string
  day: string
  amount: number
  providerId: string
  participantIds?: string[]
}

export const createService = (
  groups: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupId: string, input: CreateServiceInput) => {
    const group = await groups.findById(groupId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    const participantIds = input.participantIds ?? group.members.map(member => member.userId)
    if (
      !groupHasMember(group, input.providerId) ||
      participantIds.some(id => !groupHasMember(group, id))
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
    return toGroupDto(
      group,
      await expenses.findByGroupId(groupId),
      await services.findByGroupId(groupId),
      await paybacks.findByGroupId(groupId)
    )
  }
})
