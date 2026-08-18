import type { IExpenseRepository } from '../../expenses/domain/IExpense.repository.ts'
import { notFound } from '../../domain/notFound.ts'
import { toGroupDto } from '../../groups/application/ToGroup.mapper.ts'
import { groupHasMember } from '../../groups/domain/Group.entity.ts'
import type { IGroupRepository } from '../../groups/domain/IGroup.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import type { IPaybackRepository } from '../domain/IPayback.repository.ts'

export const deletePayback = (
  groups: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupeId: string, paybackId: string) => {
    const group = await groups.findById(groupeId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    const payback = await paybacks.findById(paybackId)
    if (!payback || payback.groupeId !== groupeId) {
      throw notFound('Règlement introuvable')
    }
    await paybacks.delete(paybackId)
    return toGroupDto(
      group,
      await expenses.findByGroupeId(groupeId),
      await services.findByGroupeId(groupeId),
      await paybacks.findByGroupeId(groupeId)
    )
  }
})
