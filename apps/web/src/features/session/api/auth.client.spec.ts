/** @vitest-environment happy-dom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })

// The client must be created after fetch is stubbed: load it on demand.
const loadAuthClient = async () => (await import('./auth.client')).authClient

const fetchCall = () => fetchMock.mock.calls[0]

const fetchUrl = () => String(fetchCall()[0])

const fetchInit = () => fetchCall()[1] as RequestInit
const postedBody = () => JSON.parse(fetchInit().body as string)

describe('authClient', () => {
  it('signs a User up through the API', async () => {
    fetchMock.mockResolvedValue(respond({ token: 'token', user: { id: 'u1', name: 'Léa' } }))
    const authClient = await loadAuthClient()

    const result = await authClient.signUp.email({
      email: 'lea@example.com',
      password: 'password1234',
      name: 'Léa'
    })

    expect(fetchUrl()).toMatch(/\/sign-up\/email$/)
    expect(fetchInit()).toMatchObject({ method: 'POST' })
    expect(postedBody()).toEqual({
      email: 'lea@example.com',
      password: 'password1234',
      name: 'Léa'
    })
    expect(result.error).toBeNull()
    expect(result.data).toEqual({ token: 'token', user: { id: 'u1', name: 'Léa' } })
  })

  it('signs a User in through the API', async () => {
    fetchMock.mockResolvedValue(respond({ token: 'token', user: { id: 'u1', name: 'Léa' } }))
    const authClient = await loadAuthClient()

    const result = await authClient.signIn.email({
      email: 'lea@example.com',
      password: 'password1234'
    })

    expect(fetchUrl()).toMatch(/\/sign-in\/email$/)
    expect(fetchInit()).toMatchObject({ method: 'POST' })
    expect(postedBody()).toEqual({ email: 'lea@example.com', password: 'password1234' })
    expect(result.error).toBeNull()
  })

  it('signs the session out through the API', async () => {
    fetchMock.mockResolvedValue(respond({}))
    const authClient = await loadAuthClient()

    const result = await authClient.signOut()

    expect(fetchUrl()).toMatch(/\/sign-out$/)
    expect(fetchInit()).toMatchObject({ method: 'POST' })
    expect(result.error).toBeNull()
  })

  it('surfaces an API error message', async () => {
    fetchMock.mockResolvedValue(respond({ message: 'E-mail déjà utilisé' }, 400))
    const authClient = await loadAuthClient()

    const result = await authClient.signUp.email({
      email: 'lea@example.com',
      password: 'password1234',
      name: 'Léa'
    })

    expect(result.data).toBeNull()
    expect(result.error?.message).toBe('E-mail déjà utilisé')
  })
})
