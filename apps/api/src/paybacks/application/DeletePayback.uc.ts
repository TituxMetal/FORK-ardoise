import type { IExpenseRepository } from '~/expenses/domain/IExpense.repository'
import { notFound } from '~/shared/domain'
import { toGroupDto } from '~/groups/application/ToGroup.mapper'
import { groupHasMember } from '~/groups/domain/Group.entity'
import type { IGroupRepository } from '~/groups/domain/IGroup.repository'
import type { IServiceRepository } from '~/services/domain/IService.repository'
import type { IPaybackRepository } from '~/paybacks/domain/IPayback.repository'

export const deletePayback = (
  groups: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupId: string, paybackId: string) => {
    const group = await groups.findById(groupId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    const payback = await paybacks.findById(paybackId)
    if (!payback || payback.groupId !== groupId) {
      throw notFound('Règlement introuvable')
    }
    await paybacks.delete(paybackId)
    return toGroupDto(
      group,
      await expenses.findByGroupId(groupId),
      await services.findByGroupId(groupId),
      await paybacks.findByGroupId(groupId)
    )
  }
})
