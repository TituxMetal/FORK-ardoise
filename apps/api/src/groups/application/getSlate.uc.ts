import type { Expense } from '~/expenses/domain/expense.entity'
import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import type { Payback } from '~/paybacks/domain/payback.entity'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'
import type { Service } from '~/services/domain/service.entity'
import type { ServiceRepository } from '~/services/domain/service.repository'
import { balancesOf, notFound } from '~/shared/domain'
import type { GroupDto } from '~/groups/application/group.dto'
import { groupHasMember, type Group } from '~/groups/domain/group.entity'
import type { GroupRepository } from '~/groups/domain/group.repository'

export type SlateView = {
  execute: (userId: string, groupId: string) => Promise<GroupDto>
}

export const getSlate = (
  groups: GroupRepository,
  expenses: ExpenseRepository,
  services: ServiceRepository,
  paybacks: PaybackRepository
): SlateView => ({
  execute: async (userId: string, groupId: string) => {
    const group = await groups.findById(groupId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    return toGroupDto(
      group,
      await expenses.findByGroupId(groupId),
      await services.findByGroupId(groupId),
      await paybacks.findByGroupId(groupId)
    )
  }
})

const toGroupDto = (
  group: Group,
  expenses: Expense[] = [],
  services: Service[] = [],
  paybacks: Payback[] = []
): GroupDto => {
  const members = group.members.map(member => ({
    userId: member.userId,
    name: member.name
  }))
  return {
    id: group.id,
    name: group.name.value,
    members,
    invite: { secret: group.inviteSecret },
    expenses: expenses.map(expense => ({
      id: expense.id,
      label: expense.label.value,
      day: expense.day.value,
      amount: expense.amount.value,
      payerId: expense.payerId,
      participantIds: expense.participantIds,
      parts: expense.parts.map(part => ({
        userId: part.userId,
        amount: part.amount.value
      }))
    })),
    services: services.map(service => ({
      id: service.id,
      label: service.label.value,
      day: service.day.value,
      amount: service.amount.value,
      providerId: service.providerId,
      participantIds: service.participantIds,
      parts: service.parts.map(part => ({
        userId: part.userId,
        amount: part.amount.value
      }))
    })),
    paybacks: paybacks.map(payback => ({
      id: payback.id,
      debtorId: payback.debtorId,
      creditorId: payback.creditorId,
      amount: payback.amount.value
    })),
    balances: balancesOf(
      members,
      expenses.map(expense => ({
        payerId: expense.payerId,
        amount: expense.amount.value,
        parts: expense.parts
      })),
      services.map(service => ({
        providerId: service.providerId,
        amount: service.amount.value,
        parts: service.parts
      })),
      paybacks.map(payback => ({
        debtorId: payback.debtorId,
        creditorId: payback.creditorId,
        amount: payback.amount.value
      }))
    )
  }
}
