import type { IExpenseRepository } from '~/expenses/domain/IExpense.repository'
import { dayFrom } from '~/expenses/domain/Day.vo'
import { labelFrom } from '~/expenses/domain/Label.vo'
import { expenseCreate } from '~/expenses/domain/Expense.entity'
import { amountFromCents, invalidData, notFound } from '~/shared/domain'

import { toGroupDto } from '~/groups/application/toGroup.mapper'
import { groupHasMember } from '~/groups/domain/group.entity'
import type { GroupRepository } from '~/groups/domain/group.repository'
import type { IPaybackRepository } from '~/paybacks/domain/IPayback.repository'
import type { IServiceRepository } from '~/services/domain/IService.repository'

export type CreateExpenseInput = {
  label: string
  day: string
  amount: number
  payerId: string
  participantIds?: string[]
}

export const createExpense = (
  groups: GroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupId: string, input: CreateExpenseInput) => {
    const group = await groups.findById(groupId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    const participantIds = input.participantIds ?? group.members.map(member => member.userId)
    if (
      !groupHasMember(group, input.payerId) ||
      participantIds.some(id => !groupHasMember(group, id))
    ) {
      throw invalidData('Membre introuvable')
    }
    const expense = expenseCreate(
      groupId,
      labelFrom(input.label),
      dayFrom(input.day),
      amountFromCents(input.amount),
      input.payerId,
      participantIds
    )
    await expenses.save(expense)
    return toGroupDto(
      group,
      await expenses.findByGroupId(groupId),
      await services.findByGroupId(groupId),
      await paybacks.findByGroupId(groupId)
    )
  }
})
