import type { IExpenseRepository } from '../../expenses/domain/IExpense.repository.ts'
import { notFound } from '../../domain/notFound.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import type { IPaybackRepository } from '../domain/IPayback.repository.ts'

export const deletePayback = (
  groupes: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupeId: string, paybackId: string) => {
    const groupe = await groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw notFound('Groupe introuvable')
    }
    const payback = await paybacks.findById(paybackId)
    if (!payback || payback.groupeId !== groupeId) {
      throw notFound('Règlement introuvable')
    }
    await paybacks.delete(paybackId)
    return toGroupeDto(
      groupe,
      await expenses.findByGroupeId(groupeId),
      await services.findByGroupeId(groupeId),
      await paybacks.findByGroupeId(groupeId)
    )
  }
})
