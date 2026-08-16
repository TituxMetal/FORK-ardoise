import type { Part } from './Part.ts'

export type Balance = {
  userId: string
  name: string
  amount: number
}

export type ExpenseForBalance = {
  payerId: string
  amount: number
  parts: Part[]
}

export type ServiceForBalance = {
  providerId: string
  amount: number
  parts: Part[]
}

export type PaybackForBalance = {
  debtorId: string
  creditorId: string
  amount: number
}

export const balancesOf = (
  members: { userId: string; name: string }[],
  expenses: ExpenseForBalance[],
  services: ServiceForBalance[] = [],
  paybacks: PaybackForBalance[] = []
): Balance[] =>
  members.map(member => {
    let amount = 0
    for (const expense of expenses) {
      if (expense.payerId === member.userId) {
        amount += expense.amount
      }
      for (const part of expense.parts) {
        if (part.userId === member.userId) {
          amount -= part.amount.value
        }
      }
    }
    for (const service of services) {
      if (service.providerId === member.userId) {
        amount += service.amount
      }
      for (const part of service.parts) {
        if (part.userId === member.userId) {
          amount -= part.amount.value
        }
      }
    }
    for (const payback of paybacks) {
      if (payback.creditorId === member.userId) {
        amount -= payback.amount
      }
      if (payback.debtorId === member.userId) {
        amount += payback.amount
      }
    }
    return { userId: member.userId, name: member.name, amount }
  })
