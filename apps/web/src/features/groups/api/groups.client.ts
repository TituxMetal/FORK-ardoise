import { createApiClient, unwrap, type HttpClientOptions } from '~/lib/http.client'
import type { GroupsClient } from '../types'

export const createGroupsClient = (options: HttpClientOptions = {}): GroupsClient => {
  const http = createApiClient(options.baseUrl ?? '/api', options.fetch)
  return {
    list: async () => unwrap(await http.groups.$get()),
    create: async name => unwrap(await http.groups.$post({ json: { name } })),
    get: async id => unwrap(await http.groups[':id'].$get({ param: { id } })),
    join: async secret => unwrap(await http.invites[':secret'].$post({ param: { secret } })),
    rename: async (id, name) =>
      unwrap(await http.groups[':id'].$patch({ param: { id }, json: { name } })),
    leave: async id => {
      await unwrap(await http.groups[':id'].$delete({ param: { id } }))
    }
  }
}

export const groupsClient: GroupsClient = createGroupsClient()
