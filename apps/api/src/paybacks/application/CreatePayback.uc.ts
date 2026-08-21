import { amountFromCents, balancesOf, invalidData, notFound } from '~/shared/domain'

import type { IExpenseRepository } from '~/expenses/domain/IExpense.repository'
import { toGroupDto } from '~/groups/application/ToGroup.mapper'
import { groupHasMember } from '~/groups/domain/Group.entity'
import type { IGroupRepository } from '~/groups/domain/IGroup.repository'
import type { IServiceRepository } from '~/services/domain/IService.repository'
import { paybackCreate } from '~/paybacks/domain/Payback.entity'
import type { IPaybackRepository } from '~/paybacks/domain/IPayback.repository'

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
  execute: async (userId: string, groupId: string, input: CreatePaybackInput) => {
    const group = await groups.findById(groupId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    if (!groupHasMember(group, input.debtorId) || !groupHasMember(group, input.creditorId)) {
      throw invalidData('Membre introuvable')
    }
    const groupExpenses = await expenses.findByGroupId(groupId)
    const providedServices = await services.findByGroupId(groupId)
    const existing = await paybacks.findByGroupId(groupId)
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
      groupId,
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
