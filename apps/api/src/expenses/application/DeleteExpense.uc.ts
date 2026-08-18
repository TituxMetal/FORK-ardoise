import { notFound } from '../../domain/notFound.ts'
import { toGroupDto } from '../../groups/application/ToGroup.mapper.ts'
import { groupHasMember } from '../../groups/domain/Group.entity.ts'
import type { IGroupRepository } from '../../groups/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import type { IExpenseRepository } from '../domain/IExpense.repository.ts'

export const deleteExpense = (
  groups: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupeId: string, expenseId: string) => {
    const group = await groups.findById(groupeId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    const expense = await expenses.findById(expenseId)
    if (!expense || expense.groupeId !== groupeId) {
      throw notFound('Dépense introuvable')
    }
    await expenses.delete(expenseId)
    return toGroupDto(
      group,
      await expenses.findByGroupeId(groupeId),
      await services.findByGroupeId(groupeId),
      await paybacks.findByGroupeId(groupeId)
    )
  }
})
