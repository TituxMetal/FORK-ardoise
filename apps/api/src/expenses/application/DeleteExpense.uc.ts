import { notFound } from '~/shared/domain'
import { toGroupDto } from '~/groups/application/ToGroup.mapper'
import { groupHasMember } from '~/groups/domain/Group.entity'
import type { IGroupRepository } from '~/groups/domain/IGroup.repository'
import type { IPaybackRepository } from '~/paybacks/domain/IPayback.repository'
import type { IServiceRepository } from '~/services/domain/IService.repository'
import type { IExpenseRepository } from '~/expenses/domain/IExpense.repository'

export const deleteExpense = (
  groups: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupId: string, expenseId: string) => {
    const group = await groups.findById(groupId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    const expense = await expenses.findById(expenseId)
    if (!expense || expense.groupId !== groupId) {
      throw notFound('Dépense introuvable')
    }
    await expenses.delete(expenseId)
    return toGroupDto(
      group,
      await expenses.findByGroupId(groupId),
      await services.findByGroupId(groupId),
      await paybacks.findByGroupId(groupId)
    )
  }
})
