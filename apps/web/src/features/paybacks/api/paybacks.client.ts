import type { InferRequestType } from 'hono/client'
import type { GroupDto } from '~features/groups/api'
import { createApiClient, unwrap, type ApiClient, type HttpClientOptions } from '~/lib/http.client'

export type CreatePaybackInput = InferRequestType<
  ApiClient['groups'][':groupId']['paybacks']['$post']
>['json']

export type PaybacksClient = {
  create: (groupId: string, input: CreatePaybackInput) => Promise<GroupDto>
  delete: (groupId: string, paybackId: string) => Promise<GroupDto>
}

export const createPaybacksClient = (options: HttpClientOptions = {}): PaybacksClient => {
  const http = createApiClient(options.baseUrl ?? '/api', options.fetch)
  return {
    create: async (groupId, input) =>
      unwrap(await http.groups[':groupId'].paybacks.$post({ param: { groupId }, json: input })),
    delete: async (groupId, paybackId) =>
      unwrap(
        await http.groups[':groupId'].paybacks[':id'].$delete({
          param: { groupId, id: paybackId }
        })
      )
  }
}

export const paybacksClient: PaybacksClient = createPaybacksClient()
