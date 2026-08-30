import type { InferResponseType } from 'hono/client'
import type { ApiClient } from '~/lib/http.client'

export type UpdateNameResult = InferResponseType<ApiClient['users']['me']['$patch'], 200>

export type UsersClient = {
  rename: (name: string) => Promise<UpdateNameResult>
}
