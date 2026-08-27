import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { notFound } from '~/shared/domain'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'
import type { ServiceRepository } from '~/services/domain/service.repository'
import { groupHasMember } from '~/groups/domain/group.entity'
import type { GroupRepository } from '~/groups/domain/group.repository'
import { toGroupDto } from '~/groups/application/toGroup.mapper'

export const getGroup = (
  groups: GroupRepository,
  expenses: ExpenseRepository,
  services: ServiceRepository,
  paybacks: PaybackRepository
) => ({
  execute: async (userId: string, groupId: string) => {
    const group = await groups.findById(groupId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    return toGroupDto(
      group,
      await expenses.findByGroupId(groupId),
      await services.findByGroupId(groupId),
      await paybacks.findByGroupId(groupId)
    )
  }
})
