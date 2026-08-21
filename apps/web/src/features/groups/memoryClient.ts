import type {
  CreateExpenseInput,
  CreatePaybackInput,
  CreateServiceInput,
  GroupDto,
  GroupSummary,
  GroupsClient
} from '~features/groups/client'

const emptyGroup = (id: string, name: string, members: GroupDto['members']): GroupDto => ({
  id,
  name,
  members,
  invite: { secret: 'invite-secret' },
  expenses: [],
  services: [],
  paybacks: [],
  balances: members.map(member => ({ ...member, amount: 0 }))
})

const equalParts = (amount: number, participantIds: string[], creditedId: string) => {
  const wholePart = Math.floor(amount / participantIds.length)
  const remainder = amount - wholePart * participantIds.length
  const parts = participantIds.map(userId => ({
    userId,
    amount: userId === creditedId ? wholePart + remainder : wholePart
  }))
  if (!participantIds.includes(creditedId) && remainder > 0) {
    parts.push({ userId: creditedId, amount: remainder })
  }
  return parts
}

const balancesFrom = (group: GroupDto) =>
  group.members.map(member => {
    let amount = 0
    for (const expense of group.expenses) {
      if (expense.payerId === member.userId) {
        amount += expense.amount
      }
      for (const part of expense.parts) {
        if (part.userId === member.userId) {
          amount -= part.amount
        }
      }
    }
    for (const service of group.services) {
      if (service.providerId === member.userId) {
        amount += service.amount
      }
      for (const part of service.parts) {
        if (part.userId === member.userId) {
          amount -= part.amount
        }
      }
    }
    for (const payback of group.paybacks) {
      if (payback.creditorId === member.userId) {
        amount -= payback.amount
      }
      if (payback.debtorId === member.userId) {
        amount += payback.amount
      }
    }
    return { ...member, amount }
  })

export const createMemoryClient = (): GroupsClient => {
  const groups = new Map<string, GroupDto>()
  return {
    list: async (): Promise<GroupSummary[]> =>
      [...groups.values()].map(group => ({ id: group.id, name: group.name })),
    create: async (name: string): Promise<GroupDto> => {
      const group = emptyGroup(crypto.randomUUID(), name, [
        { userId: 'lea', name: 'Léa' },
        { userId: 'bob', name: 'Bob' },
        { userId: 'camille', name: 'Camille' }
      ])
      groups.set(group.id, group)
      return group
    },
    get: async (id: string): Promise<GroupDto> => {
      const group = groups.get(id)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      return group
    },
    join: async () => {
      throw new Error('Invitation introuvable')
    },
    createExpense: async (groupId: string, input: CreateExpenseInput): Promise<GroupDto> => {
      const group = groups.get(groupId)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      const participantIds = input.participantIds ?? group.members.map(member => member.userId)
      const next: GroupDto = {
        ...group,
        expenses: [
          ...group.expenses,
          {
            id: crypto.randomUUID(),
            label: input.label,
            day: input.day,
            amount: input.amount,
            payerId: input.payerId,
            participantIds,
            parts: equalParts(input.amount, participantIds, input.payerId)
          }
        ]
      }
      next.balances = balancesFrom(next)
      groups.set(groupId, next)
      return next
    },
    deleteExpense: async (groupId: string, expenseId: string): Promise<GroupDto> => {
      const group = groups.get(groupId)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      const next: GroupDto = {
        ...group,
        expenses: group.expenses.filter(expense => expense.id !== expenseId)
      }
      next.balances = balancesFrom(next)
      groups.set(groupId, next)
      return next
    },
    createService: async (groupId: string, input: CreateServiceInput): Promise<GroupDto> => {
      const group = groups.get(groupId)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      const participantIds = input.participantIds ?? group.members.map(member => member.userId)
      const next: GroupDto = {
        ...group,
        services: [
          ...group.services,
          {
            id: crypto.randomUUID(),
            label: input.label,
            day: input.day,
            amount: input.amount,
            providerId: input.providerId,
            participantIds,
            parts: equalParts(input.amount, participantIds, input.providerId)
          }
        ]
      }
      next.balances = balancesFrom(next)
      groups.set(groupId, next)
      return next
    },
    deleteService: async (groupId: string, serviceId: string): Promise<GroupDto> => {
      const group = groups.get(groupId)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      const next: GroupDto = {
        ...group,
        services: group.services.filter(service => service.id !== serviceId)
      }
      next.balances = balancesFrom(next)
      groups.set(groupId, next)
      return next
    },
    createPayback: async (groupId: string, input: CreatePaybackInput): Promise<GroupDto> => {
      const group = groups.get(groupId)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      const next: GroupDto = {
        ...group,
        paybacks: [
          ...group.paybacks,
          {
            id: crypto.randomUUID(),
            debtorId: input.debtorId,
            creditorId: input.creditorId,
            amount: input.amount
          }
        ]
      }
      next.balances = balancesFrom(next)
      groups.set(groupId, next)
      return next
    },
    deletePayback: async (groupId: string, paybackId: string): Promise<GroupDto> => {
      const group = groups.get(groupId)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      const next: GroupDto = {
        ...group,
        paybacks: group.paybacks.filter(payback => payback.id !== paybackId)
      }
      next.balances = balancesFrom(next)
      groups.set(groupId, next)
      return next
    }
  }
}
