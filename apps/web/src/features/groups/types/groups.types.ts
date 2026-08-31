import type { InferResponseType } from 'hono/client'
import type { ApiClient } from '~/lib/http.client'

export type GroupSummary = InferResponseType<ApiClient['groups']['$get'], 200>[number]

export type InvitePreview = InferResponseType<
  ApiClient['invites'][':secret']['preview']['$get'],
  200
>

export type Group = InferResponseType<ApiClient['groups'][':id']['$get'], 200>

export type GroupsClient = {
  list: () => Promise<GroupSummary[]>
  create: (name: string) => Promise<Group>
  get: (id: string) => Promise<Group>
  preview: (secret: string) => Promise<InvitePreview>
  join: (secret: string) => Promise<Group>
  rename: (id: string, name: string) => Promise<GroupSummary>
  leave: (id: string) => Promise<void>
}
