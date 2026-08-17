import { amountFromCents } from '../../domain/Amount.ts'
import { balancesOf } from '../../domain/Balance.ts'
import { invalidData } from '../../domain/invalidData.ts'
import { notFound } from '../../domain/notFound.ts'
import type { IExpenseRepository } from '../../expenses/domain/IExpense.repository.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { paybackCreate } from '../domain/Payback.entity.ts'
import type { IPaybackRepository } from '../domain/IPayback.repository.ts'

export type CreatePaybackInput = {
  debtorId: string
  creditorId: string
  amount: number
}

export const createPayback = (
  groupes: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupeId: string, input: CreatePaybackInput) => {
    const groupe = await groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw notFound('Groupe introuvable')
    }
    if (!groupe.hasMembre(input.debtorId) || !groupe.hasMembre(input.creditorId)) {
      throw invalidData('Membre introuvable')
    }
    const groupExpenses = await expenses.findByGroupeId(groupeId)
    const providedServices = await services.findByGroupeId(groupeId)
    const existing = await paybacks.findByGroupeId(groupeId)
    const balances = balancesOf(
      groupe.membres.map(membre => ({ userId: membre.userId, name: membre.name })),
      groupExpenses.map(expense => ({
        payerId: expense.payerId,
        amount: expense.amount.value,
        parts: expense.parts
      })),
      providedServices.map(service => ({
        providerId: service.providerId,
        amount: service.amount.value,
        parts: service.parts
      })),
      existing.map(payback => ({
        debtorId: payback.debtorId,
        creditorId: payback.creditorId,
        amount: payback.amount.value
      }))
    )
    const debtorBalance = balances.find(balance => balance.userId === input.debtorId)?.amount ?? 0
    const creditorBalance =
      balances.find(balance => balance.userId === input.creditorId)?.amount ?? 0
    const payback = paybackCreate(
      groupeId,
      input.debtorId,
      input.creditorId,
      amountFromCents(input.amount),
      debtorBalance,
      creditorBalance
    )
    await paybacks.save(payback)
    return toGroupeDto(groupe, groupExpenses, providedServices, [...existing, payback])
  }
})
