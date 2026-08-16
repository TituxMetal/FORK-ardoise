export type MembreDto = {
  userId: string
  name: string
}

export type SoldeDto = {
  userId: string
  name: string
  amount: number
}

export type PartDto = {
  userId: string
  amount: number
}

export type DepenseDto = {
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

export type GroupeDto = {
  id: string
  name: string
  members: MembreDto[]
  invitation: {
    secret: string
  }
  expenses: DepenseDto[]
  services: ServiceDto[]
  settlements: []
  balances: SoldeDto[]
}
