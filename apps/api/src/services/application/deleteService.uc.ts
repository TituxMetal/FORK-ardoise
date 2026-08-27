import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { notFound } from '~/shared/domain'
import { toGroupDto } from '~/groups/application/toGroup.mapper'
import { groupHasMember } from '~/groups/domain/group.entity'
import type { GroupRepository } from '~/groups/domain/group.repository'
import type { IPaybackRepository } from '~/paybacks/domain/IPayback.repository'
import type { ServiceRepository } from '~/services/domain/service.repository'

export const deleteService = (
  groups: GroupRepository,
  expenses: ExpenseRepository,
  services: ServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupId: string, serviceId: string) => {
    const group = await groups.findById(groupId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    const service = await services.findById(serviceId)
    if (!service || service.groupId !== groupId) {
      throw notFound('Service introuvable')
    }
    await services.delete(serviceId)
    return toGroupDto(
      group,
      await expenses.findByGroupId(groupId),
      await services.findByGroupId(groupId),
      await paybacks.findByGroupId(groupId)
    )
  }
})
