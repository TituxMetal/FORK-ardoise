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

export type ReglementDto = {
  id: string
  debtorId: string
  creditorId: string
  amount: number
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
  settlements: ReglementDto[]
  balances: SoldeDto[]
}

export type GroupeSummary = {
  id: string
  name: string
}

export type CreateDepenseInput = {
  label: string
  day: string
  amount: number
  payerId: string
  participantIds?: string[]
}

export type CreateServiceInput = {
  label: string
  day: string
  amount: number
  providerId: string
  participantIds?: string[]
}

export type CreateReglementInput = {
  debtorId: string
  creditorId: string
  amount: number
}

export type GroupesClient = {
  list: () => Promise<GroupeSummary[]>
  create: (name: string) => Promise<GroupeDto>
  get: (id: string) => Promise<GroupeDto>
  join: (secret: string) => Promise<GroupeDto>
  createExpense: (groupeId: string, input: CreateDepenseInput) => Promise<GroupeDto>
  deleteExpense: (groupeId: string, expenseId: string) => Promise<GroupeDto>
  createService: (groupeId: string, input: CreateServiceInput) => Promise<GroupeDto>
  deleteService: (groupeId: string, serviceId: string) => Promise<GroupeDto>
  createSettlement: (groupeId: string, input: CreateReglementInput) => Promise<GroupeDto>
  deleteSettlement: (groupeId: string, settlementId: string) => Promise<GroupeDto>
}

const request = async <T>(path: string, init?: { method?: string; body?: string }): Promise<T> => {
  const response = await fetch(path, {
    credentials: 'include',
    method: init?.method,
    body: init?.body,
    headers: { 'content-type': 'application/json' }
  })
  if (!response.ok) {
    throw new Error('Groupe introuvable')
  }
  return response.json() as Promise<T>
}

export const groupesClient: GroupesClient = {
  list: () => request<GroupeSummary[]>('/api/groups'),
  create: name =>
    request<GroupeDto>('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name })
    }),
  get: id => request<GroupeDto>(`/api/groups/${id}`),
  join: secret =>
    request<GroupeDto>(`/api/invitations/${secret}`, {
      method: 'POST'
    }),
  createExpense: (groupeId, input) =>
    request<GroupeDto>(`/api/groups/${groupeId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(input)
    }),
  deleteExpense: (groupeId, expenseId) =>
    request<GroupeDto>(`/api/groups/${groupeId}/expenses/${expenseId}`, {
      method: 'DELETE'
    }),
  createService: (groupeId, input) =>
    request<GroupeDto>(`/api/groups/${groupeId}/services`, {
      method: 'POST',
      body: JSON.stringify(input)
    }),
  deleteService: (groupeId, serviceId) =>
    request<GroupeDto>(`/api/groups/${groupeId}/services/${serviceId}`, {
      method: 'DELETE'
    }),
  createSettlement: (groupeId, input) =>
    request<GroupeDto>(`/api/groups/${groupeId}/settlements`, {
      method: 'POST',
      body: JSON.stringify(input)
    }),
  deleteSettlement: (groupeId, settlementId) =>
    request<GroupeDto>(`/api/groups/${groupeId}/settlements/${settlementId}`, {
      method: 'DELETE'
    })
}
