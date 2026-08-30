import { createApiClient, unwrap, type HttpClientOptions } from '~/lib/http.client'
import type { UsersClient } from '../types'

export const createUsersClient = (options: HttpClientOptions = {}): UsersClient => {
  const http = createApiClient(options.baseUrl ?? '/api', options.fetch)
  return {
    rename: async name => unwrap(await http.users.me.$patch({ json: { name } }))
  }
}

export const usersClient: UsersClient = createUsersClient()
