import { describe, expect, it, vi } from 'vite-plus/test'
import { createApiClient, unwrap, type ApiFetch } from './http.client'

const ok = <T>(body: T) => ({ ok: true, status: 200, json: async () => body })

const empty = () => ({ ok: true, status: 204, json: async () => undefined })

const notOk = (body: unknown) => ({ ok: false, status: 400, json: async () => body })

describe('unwrap', () => {
  it('resolves with the JSON body of a successful response', async () => {
    await expect(unwrap(ok({ id: 'g1' }))).resolves.toEqual({ id: 'g1' })
  })

  it('resolves with nothing for an empty successful response', async () => {
    await expect(unwrap(empty())).resolves.toBeUndefined()
  })

  it('throws the API message when the response is not ok', async () => {
    await expect(unwrap(notOk({ message: 'Groupe introuvable' }))).rejects.toThrow(
      'Groupe introuvable'
    )
  })

  it('throws a fallback when the error body carries no message', async () => {
    await expect(unwrap(notOk('nope'))).rejects.toThrow('Réponse inattendue du serveur')
  })
})

describe('createApiClient', () => {
  it('routes requests through the injected fetch', async () => {
    const fetchMock = vi.fn<ApiFetch>(async () => new Response('{}', { status: 200 }))

    await createApiClient('http://test.local', fetchMock).ping.$get()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const input = fetchMock.mock.calls[0][0]
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    expect(url).toContain('/ping')
  })
})
