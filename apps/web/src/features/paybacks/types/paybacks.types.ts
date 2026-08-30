import type { InferRequestType } from 'hono/client'
import type { ApiClient } from '~/lib/http.client'
import type { Group } from '~features/groups'

export type CreatePaybackInput = InferRequestType<
  ApiClient['groups'][':groupId']['paybacks']['$post']
>['json']

export type UpdatePaybackInput = InferRequestType<
  ApiClient['groups'][':groupId']['paybacks'][':id']['$patch']
>['json']

export type PaybacksClient = {
  create: (groupId: string, input: CreatePaybackInput) => Promise<Group>
  update: (groupId: string, paybackId: string, input: UpdatePaybackInput) => Promise<Group>
  delete: (groupId: string, paybackId: string) => Promise<Group>
}
