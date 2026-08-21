import type { IExpenseRepository } from '~/expenses/domain/IExpense.repository'
import { notFound } from '~/domain/notFound'
import { toGroupDto } from '~/groups/application/ToGroup.mapper'
import { groupHasMember } from '~/groups/domain/Group.entity'
import type { IGroupRepository } from '~/groups/domain/IGroup.repository'
import type { IPaybackRepository } from '~/paybacks/domain/IPayback.repository'
import type { IServiceRepository } from '~/services/domain/IService.repository'

export const deleteService = (
  groups: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
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
