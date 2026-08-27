import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { notFound } from '~/shared/domain'
import { toGroupDto } from '~/groups/application/toGroup.mapper'
import { groupHasMember } from '~/groups/domain/group.entity'
import type { GroupRepository } from '~/groups/domain/group.repository'
import type { ServiceRepository } from '~/services/domain/service.repository'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'

export const deletePayback = (
  groups: GroupRepository,
  expenses: ExpenseRepository,
  services: ServiceRepository,
  paybacks: PaybackRepository
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
