export type MemberDto = {
  userId: string
  name: string
}

export type BalanceDto = {
  userId: string
  name: string
  amount: number
}

export type PartDto = {
  userId: string
  amount: number
}

export type ExpenseDto = {
  id: string
  label: string
  day: string
  amount: number
  payerId: string
  participantIds: string[]
  parts: PartDto[]
}

export type ServiceDto = {
  id: string
  label: string
  day: string
  amount: number
  providerId: string
  participantIds: string[]
  parts: PartDto[]
}

export type PaybackDto = {
  id: string
  debtorId: string
  creditorId: string
  day: string
  amount: number
}

export type GroupDto = {
  id: string
  name: string
  selfMemberId: string
  members: MemberDto[]
  invite: {
    secret: string
  }
  expenses: ExpenseDto[]
  services: ServiceDto[]
  paybacks: PaybackDto[]
  balances: BalanceDto[]
}
