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

export type GroupeSummary = {
  id: string
  name: string
}

export type GroupesClient = {
  list: () => Promise<GroupeSummary[]>
  create: (name: string) => Promise<GroupeDto>
  get: (id: string) => Promise<GroupeDto>
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
  get: id => request<GroupeDto>(`/api/groups/${id}`)
}
