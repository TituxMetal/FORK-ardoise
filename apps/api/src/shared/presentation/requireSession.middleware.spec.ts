import { Hono } from 'hono'
import { describe, expect, it } from 'vite-plus/test'
import type { Auth } from '../application'
import { mapException } from './mapException.filter'
import { requireSession } from './requireSession.middleware'

const buildApp = (auth: Auth) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  app.onError(mapException)
  app.use('/private/*', requireSession(auth))
  app.get('/private/me', c => c.json({ userId: c.get('userId'), userName: c.get('userName') }))
  return app
}

const signedOut: Auth = {
  handler: async () => new Response(null, { status: 404 }),
  getSessionUser: async () => null
}

const signedIn: Auth = {
  handler: async () => new Response(null, { status: 404 }),
  getSessionUser: async () => ({ id: 'lea', name: 'Léa' })
}

describe('requireSession', () => {
  it('rejects the request when there is no session', async () => {
    const app = buildApp(signedOut)

    const response = await app.request('/private/me')

    expect(response.status).toBe(401)
  })

  it('sets the User identity on the context when there is a session', async () => {
    const app = buildApp(signedIn)

    const response = await app.request('/private/me')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ userId: 'lea', userName: 'Léa' })
  })
})
