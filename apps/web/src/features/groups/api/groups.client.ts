import type { InferResponseType } from 'hono/client'
import { createApiClient, unwrap, type ApiClient, type HttpClientOptions } from '~/lib/http.client'

export type GroupSummary = InferResponseType<ApiClient['groups']['$get'], 200>[number]

export type GroupDto = InferResponseType<ApiClient['groups'][':id']['$get'], 200>

export type GroupsClient = {
  list: () => Promise<GroupSummary[]>
  create: (name: string) => Promise<GroupDto>
  get: (id: string) => Promise<GroupDto>
  join: (secret: string) => Promise<GroupDto>
}

export const createGroupsClient = (options: HttpClientOptions = {}): GroupsClient => {
  const http = createApiClient(options.baseUrl ?? '/api', options.fetch)
  return {
    list: async () => unwrap(await http.groups.$get()),
    create: async name => unwrap(await http.groups.$post({ json: { name } })),
    get: async id => unwrap(await http.groups[':id'].$get({ param: { id } })),
    join: async secret => unwrap(await http.invites[':secret'].$post({ param: { secret } }))
  }
}

export const groupsClient: GroupsClient = createGroupsClient()
