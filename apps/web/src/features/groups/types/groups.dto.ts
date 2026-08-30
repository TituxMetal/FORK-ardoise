import type { InferResponseType } from 'hono/client'
import type { ApiClient } from '~/lib/http.client'

export type GroupSummary = InferResponseType<ApiClient['groups']['$get'], 200>[number]

export type GroupDto = InferResponseType<ApiClient['groups'][':id']['$get'], 200>

export type GroupsClient = {
  list: () => Promise<GroupSummary[]>
  create: (name: string) => Promise<GroupDto>
  get: (id: string) => Promise<GroupDto>
  join: (secret: string) => Promise<GroupDto>
}
