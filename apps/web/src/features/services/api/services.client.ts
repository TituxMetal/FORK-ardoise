import { createApiClient, unwrap, type HttpClientOptions } from '~/lib/http.client'
import type { ServicesClient } from '../types/services.dto'

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
