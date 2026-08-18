import { amountFromCents } from '../../domain/Amount.ts'
import { balancesOf } from '../../domain/Balance.ts'
import { invalidData } from '../../domain/invalidData.ts'
import { notFound } from '../../domain/notFound.ts'
import type { IExpenseRepository } from '../../expenses/domain/IExpense.repository.ts'
import { toGroupDto } from '../../groups/application/ToGroup.mapper.ts'
import { groupHasMember } from '../../groups/domain/Group.entity.ts'
import type { IGroupRepository } from '../../groups/domain/IGroup.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { paybackCreate } from '../domain/Payback.entity.ts'
import type { IPaybackRepository } from '../domain/IPayback.repository.ts'

export type CreatePaybackInput = {
  debtorId: string
  creditorId: string
  amount: number
}

export const createPayback = (
  groups: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupeId: string, input: CreatePaybackInput) => {
    const group = await groups.findById(groupeId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    if (!groupHasMember(group, input.debtorId) || !groupHasMember(group, input.creditorId)) {
      throw invalidData('Membre introuvable')
    }
    const groupExpenses = await expenses.findByGroupeId(groupeId)
    const providedServices = await services.findByGroupeId(groupeId)
    const existing = await paybacks.findByGroupeId(groupeId)
    const balances = balancesOf(
      group.members.map(member => ({ userId: member.userId, name: member.name })),
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
    return toGroupDto(group, groupExpenses, providedServices, [...existing, payback])
  }
})
