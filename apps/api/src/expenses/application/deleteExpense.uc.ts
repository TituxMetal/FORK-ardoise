import { notFound } from '~/shared/domain'
import { toGroupDto } from '~/groups/application/toGroup.mapper'
import { groupHasMember } from '~/groups/domain/group.entity'
import type { GroupRepository } from '~/groups/domain/group.repository'
import type { IPaybackRepository } from '~/paybacks/domain/IPayback.repository'
import type { IServiceRepository } from '~/services/domain/IService.repository'
import type { ExpenseRepository } from '~/expenses/domain/expense.repository'

export const deleteExpense = (
  groups: GroupRepository,
  expenses: ExpenseRepository,
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
