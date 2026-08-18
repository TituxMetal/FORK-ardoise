import type { IExpenseRepository } from '../../expenses/domain/IExpense.repository.ts'
import { notFound } from '../../domain/notFound.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { groupHasMember } from '../domain/Group.entity.ts'
import type { IGroupRepository } from '../domain/IGroup.repository.ts'
import { toGroupDto } from './ToGroup.mapper.ts'

export const getGroup = (
  groups: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupId: string) => {
    const group = await groups.findById(groupId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    return toGroupDto(
      group,
      await expenses.findByGroupeId(groupId),
      await services.findByGroupeId(groupId),
      await paybacks.findByGroupeId(groupId)
    )
  }
})
