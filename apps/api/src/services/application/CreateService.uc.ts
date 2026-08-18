import { dayFrom } from '../../expenses/domain/Day.vo.ts'
import { labelFrom } from '../../expenses/domain/Label.vo.ts'
import type { IExpenseRepository } from '../../expenses/domain/IExpense.repository.ts'
import { amountFromCents } from '../../domain/Amount.ts'
import { invalidData } from '../../domain/invalidData.ts'
import { notFound } from '../../domain/notFound.ts'
import { toGroupDto } from '../../groups/application/ToGroup.mapper.ts'
import { groupHasMember } from '../../groups/domain/Group.entity.ts'
import type { IGroupRepository } from '../../groups/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
import { serviceCreate } from '../domain/Service.entity.ts'
import type { IServiceRepository } from '../domain/IService.repository.ts'

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
  execute: async (userId: string, groupeId: string, input: CreateServiceInput) => {
    const group = await groups.findById(groupeId)
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
      groupeId,
      labelFrom(input.label),
      dayFrom(input.day),
      amountFromCents(input.amount),
      input.providerId,
      participantIds
    )
    await services.save(service)
    return toGroupDto(
      group,
      await expenses.findByGroupeId(groupeId),
      await services.findByGroupeId(groupeId),
      await paybacks.findByGroupeId(groupeId)
    )
  }
})
