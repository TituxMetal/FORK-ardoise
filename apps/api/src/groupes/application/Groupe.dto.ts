export type MembreDto = {
  userId: string
  name: string
}

export type SoldeDto = {
  userId: string
  name: string
  amount: number
}

export type GroupeDto = {
  id: string
  name: string
  members: MembreDto[]
  expenses: []
  services: []
  settlements: []
  balances: SoldeDto[]
}
