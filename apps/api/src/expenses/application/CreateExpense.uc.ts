import { amountFromCents } from '../../domain/Amount.ts'
import { invalidData } from '../../domain/invalidData.ts'
import { notFound } from '../../domain/notFound.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { dayFrom } from '../domain/Day.vo.ts'
import { expenseCreate } from '../domain/Expense.entity.ts'
import type { IExpenseRepository } from '../domain/IExpense.repository.ts'
import { labelFrom } from '../domain/Label.vo.ts'

export type CreateExpenseInput = {
  label: string
  day: string
  amount: number
  payerId: string
  participantIds?: string[]
}

export const createExpense = (
  groupes: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupeId: string, input: CreateExpenseInput) => {
    const groupe = await groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw notFound('Groupe introuvable')
    }
    const participantIds = input.participantIds ?? groupe.membres.map(membre => membre.userId)
    if (!groupe.hasMembre(input.payerId) || participantIds.some(id => !groupe.hasMembre(id))) {
      throw invalidData('Membre introuvable')
    }
    const expense = expenseCreate(
      groupeId,
      labelFrom(input.label),
      dayFrom(input.day),
      amountFromCents(input.amount),
      input.payerId,
      participantIds
    )
    await expenses.save(expense)
    return toGroupeDto(
      groupe,
      await expenses.findByGroupeId(groupeId),
      await services.findByGroupeId(groupeId),
      await paybacks.findByGroupeId(groupeId)
    )
  }
})
