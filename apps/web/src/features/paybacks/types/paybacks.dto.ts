import type { InferRequestType } from 'hono/client'
import type { ApiClient } from '~/lib/http.client'
import type { GroupDto } from '~features/groups'

export type CreatePaybackInput = InferRequestType<
  ApiClient['groups'][':groupId']['paybacks']['$post']
>['json']

export type PaybacksClient = {
  create: (groupId: string, input: CreatePaybackInput) => Promise<GroupDto>
  delete: (groupId: string, paybackId: string) => Promise<GroupDto>
}
