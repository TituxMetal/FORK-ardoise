import type { Part } from './Parts.ts'

export type Solde = {
  userId: string
  name: string
  amount: number
}

export type DepenseForSolde = {
  payerId: string
  amount: number
  parts: Part[]
}

export type ServiceForSolde = {
  providerId: string
  amount: number
  parts: Part[]
}

export const soldesOf = (
  membres: { userId: string; name: string }[],
  depenses: DepenseForSolde[],
  services: ServiceForSolde[] = []
): Solde[] =>
  membres.map(membre => {
    let amount = 0
    for (const depense of depenses) {
      if (depense.payerId === membre.userId) {
        amount += depense.amount
      }
      for (const part of depense.parts) {
        if (part.userId === membre.userId) {
          amount -= part.amount.value
        }
      }
    }
    for (const service of services) {
      if (service.providerId === membre.userId) {
        amount += service.amount
      }
      for (const part of service.parts) {
        if (part.userId === membre.userId) {
          amount -= part.amount.value
        }
      }
    }
    return { userId: membre.userId, name: membre.name, amount }
  })
