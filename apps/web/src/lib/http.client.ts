import { hc } from 'hono/client'
import type { AppType } from 'api/createApp'

/** The typed Hono client for the API, built by {@link createApiClient}. */
export type ApiClient = ReturnType<typeof hc<AppType>>

export type ApiFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export type HttpClientOptions = {
  baseUrl?: string
  fetch?: ApiFetch
}

export const createApiClient = (baseUrl: string, fetch?: ApiFetch): ApiClient =>
  hc<AppType>(baseUrl, fetch ? { fetch } : undefined)

/** Reads the JSON body of an ok response; throws the API message otherwise. */
export const unwrap = async <T>(response: { ok: boolean; json: () => Promise<T> }): Promise<T> => {
  if (response.ok) {
    return await response.json()
  }
  const body = (await response.json().catch(() => null)) as { message?: string } | null
  throw new Error(body?.message ?? 'Réponse inattendue du serveur')
}
