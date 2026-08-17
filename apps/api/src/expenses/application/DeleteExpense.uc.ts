import { notFound } from '../../domain/notFound.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import type { IExpenseRepository } from '../domain/IExpense.repository.ts'

export const deleteExpense = (
  groupes: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupeId: string, expenseId: string) => {
    const groupe = await groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw notFound('Groupe introuvable')
    }
    const expense = await expenses.findById(expenseId)
    if (!expense || expense.groupeId !== groupeId) {
      throw notFound('Dépense introuvable')
    }
    await expenses.delete(expenseId)
    return toGroupeDto(
      groupe,
      await expenses.findByGroupeId(groupeId),
      await services.findByGroupeId(groupeId),
      await paybacks.findByGroupeId(groupeId)
    )
  }
})
