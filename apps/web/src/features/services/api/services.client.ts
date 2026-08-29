import type { InferRequestType } from 'hono/client'
import type { GroupDto } from '~features/groups/api'
import { createApiClient, unwrap, type ApiClient, type HttpClientOptions } from '~/lib/http.client'

export type CreateServiceInput = InferRequestType<
  ApiClient['groups'][':groupId']['services']['$post']
>['json']

export type ServicesClient = {
  create: (groupId: string, input: CreateServiceInput) => Promise<GroupDto>
  delete: (groupId: string, serviceId: string) => Promise<GroupDto>
}

export const createServicesClient = (options: HttpClientOptions = {}): ServicesClient => {
  const http = createApiClient(options.baseUrl ?? '/api', options.fetch)
  return {
    create: async (groupId, input) =>
      unwrap(await http.groups[':groupId'].services.$post({ param: { groupId }, json: input })),
    delete: async (groupId, serviceId) =>
      unwrap(
        await http.groups[':groupId'].services[':id'].$delete({
          param: { groupId, id: serviceId }
        })
      )
  }
}

export const servicesClient: ServicesClient = createServicesClient()
