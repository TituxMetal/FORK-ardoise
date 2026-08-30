import type { InferRequestType } from 'hono/client'
import type { ApiClient } from '~/lib/http.client'
import type { GroupDto } from '~features/groups'

export type CreateServiceInput = InferRequestType<
  ApiClient['groups'][':groupId']['services']['$post']
>['json']

export type ServicesClient = {
  create: (groupId: string, input: CreateServiceInput) => Promise<GroupDto>
  delete: (groupId: string, serviceId: string) => Promise<GroupDto>
}
