import { hc, type InferRequestType, type InferResponseType } from 'hono/client'
import type { AppType } from 'api/createApp'

const createApiClient = (
  baseUrl: string,
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
) => hc<AppType>(baseUrl, fetch ? { fetch } : undefined)

/** The typed Hono client for the API, built by {@link createApiClient}. */
export type ApiClient = ReturnType<typeof createApiClient>

export type GroupSummary = InferResponseType<ApiClient['groups']['$get'], 200>[number]

export type GroupDto = InferResponseType<ApiClient['groups'][':id']['$get'], 200>

export type CreateExpenseInput = InferRequestType<
  ApiClient['groups'][':groupId']['expenses']['$post']
>['json']

export type CreateServiceInput = InferRequestType<
  ApiClient['groups'][':groupId']['services']['$post']
>['json']

export type CreatePaybackInput = InferRequestType<
  ApiClient['groups'][':groupId']['paybacks']['$post']
>['json']

export type GroupsClient = {
  list: () => Promise<GroupSummary[]>
  create: (name: string) => Promise<GroupDto>
  get: (id: string) => Promise<GroupDto>
  join: (secret: string) => Promise<GroupDto>
  createExpense: (groupId: string, input: CreateExpenseInput) => Promise<GroupDto>
  deleteExpense: (groupId: string, expenseId: string) => Promise<GroupDto>
  createService: (groupId: string, input: CreateServiceInput) => Promise<GroupDto>
  deleteService: (groupId: string, serviceId: string) => Promise<GroupDto>
  createPayback: (groupId: string, input: CreatePaybackInput) => Promise<GroupDto>
  deletePayback: (groupId: string, paybackId: string) => Promise<GroupDto>
}

export type GroupsClientOptions = {
  baseUrl?: string
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
}

const unwrap = async <T>(response: { ok: boolean; json: () => Promise<T> }): Promise<T> => {
  if (response.ok) {
    return await response.json()
  }
  const body = (await response.json().catch(() => null)) as { message?: string } | null
  throw new Error(body?.message ?? 'Réponse inattendue du serveur')
}

export const createGroupsClient = (options: GroupsClientOptions = {}): GroupsClient => {
  const http = createApiClient(options.baseUrl ?? '/api', options.fetch)
  return {
    list: async () => unwrap(await http.groups.$get()),
    create: async name => unwrap(await http.groups.$post({ json: { name } })),
    get: async id => unwrap(await http.groups[':id'].$get({ param: { id } })),
    join: async secret => unwrap(await http.invites[':secret'].$post({ param: { secret } })),
    createExpense: async (groupId, input) =>
      unwrap(await http.groups[':groupId'].expenses.$post({ param: { groupId }, json: input })),
    deleteExpense: async (groupId, expenseId) =>
      unwrap(
        await http.groups[':groupId'].expenses[':id'].$delete({ param: { groupId, id: expenseId } })
      ),
    createService: async (groupId, input) =>
      unwrap(await http.groups[':groupId'].services.$post({ param: { groupId }, json: input })),
    deleteService: async (groupId, serviceId) =>
      unwrap(
        await http.groups[':groupId'].services[':id'].$delete({ param: { groupId, id: serviceId } })
      ),
    createPayback: async (groupId, input) =>
      unwrap(await http.groups[':groupId'].paybacks.$post({ param: { groupId }, json: input })),
    deletePayback: async (groupId, paybackId) =>
      unwrap(
        await http.groups[':groupId'].paybacks[':id'].$delete({ param: { groupId, id: paybackId } })
      )
  }
}

export const groupsClient: GroupsClient = createGroupsClient()
