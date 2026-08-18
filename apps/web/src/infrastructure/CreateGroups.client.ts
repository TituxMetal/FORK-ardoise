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
  amount: number
}

export type GroupDto = {
  id: string
  name: string
  members: MemberDto[]
  invite: {
    secret: string
  }
  expenses: ExpenseDto[]
  services: ServiceDto[]
  paybacks: PaybackDto[]
  balances: BalanceDto[]
}

export type GroupSummary = {
  id: string
  name: string
}

export type CreateExpenseInput = {
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

export type CreatePaybackInput = {
  debtorId: string
  creditorId: string
  amount: number
}

export type GroupsClient = {
  list: () => Promise<GroupSummary[]>
  create: (name: string) => Promise<GroupDto>
  get: (id: string) => Promise<GroupDto>
  join: (secret: string) => Promise<GroupDto>
  createExpense: (groupeId: string, input: CreateExpenseInput) => Promise<GroupDto>
  deleteExpense: (groupeId: string, expenseId: string) => Promise<GroupDto>
  createService: (groupeId: string, input: CreateServiceInput) => Promise<GroupDto>
  deleteService: (groupeId: string, serviceId: string) => Promise<GroupDto>
  createPayback: (groupeId: string, input: CreatePaybackInput) => Promise<GroupDto>
  deletePayback: (groupeId: string, paybackId: string) => Promise<GroupDto>
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

export const groupsClient: GroupsClient = {
  list: () => request<GroupSummary[]>('/api/groups'),
  create: name =>
    request<GroupDto>('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name })
    }),
  get: id => request<GroupDto>(`/api/groups/${id}`),
  join: secret =>
    request<GroupDto>(`/api/invites/${secret}`, {
      method: 'POST'
    }),
  createExpense: (groupeId, input) =>
    request<GroupDto>(`/api/groups/${groupeId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(input)
    }),
  deleteExpense: (groupeId, expenseId) =>
    request<GroupDto>(`/api/groups/${groupeId}/expenses/${expenseId}`, {
      method: 'DELETE'
    }),
  createService: (groupeId, input) =>
    request<GroupDto>(`/api/groups/${groupeId}/services`, {
      method: 'POST',
      body: JSON.stringify(input)
    }),
  deleteService: (groupeId, serviceId) =>
    request<GroupDto>(`/api/groups/${groupeId}/services/${serviceId}`, {
      method: 'DELETE'
    }),
  createPayback: (groupeId, input) =>
    request<GroupDto>(`/api/groups/${groupeId}/paybacks`, {
      method: 'POST',
      body: JSON.stringify(input)
    }),
  deletePayback: (groupeId, paybackId) =>
    request<GroupDto>(`/api/groups/${groupeId}/paybacks/${paybackId}`, {
      method: 'DELETE'
    })
}
