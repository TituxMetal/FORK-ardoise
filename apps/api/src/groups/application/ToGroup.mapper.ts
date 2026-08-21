import type { Expense } from '~/expenses/domain/Expense.entity'
import { balancesOf } from '~/shared/domain'
import type { Payback } from '~/paybacks/domain/Payback.entity'
import type { Service } from '~/services/domain/Service.entity'
import type { Group } from '~/groups/domain/Group.entity'
import type { GroupDto } from '~/groups/application/Group.dto'

export const toGroupDto = (
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
