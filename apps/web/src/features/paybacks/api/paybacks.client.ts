import { createApiClient, unwrap, type HttpClientOptions } from '~/lib/http.client'
import type { PaybacksClient } from '../types'

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
