import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { betterAuth } from 'better-auth'
import { describe, expect, it } from 'vite-plus/test'
import type { Auth } from '../application'
import { createAuth, createAuthOptions } from './auth.adapter'
import { createPrismaClient } from './prisma.client'

const sessionSql = readFileSync(
  fileURLToPath(
    new URL('../../../prisma/migrations/20260815130000_session_user/migration.sql', import.meta.url)
  ),
  'utf8'
)

const createTestPrisma = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ardoise-auth-'))
  const url = `file:${join(dir, 'test.db')}`
  const sqlite = createClient({ url })
  await sqlite.executeMultiple(sessionSql)
  sqlite.close()
  return createPrismaClient(url)
}

const createTestAuth = async () => createAuth(await createTestPrisma())

// better-auth skips the origin check when NODE_ENV is "test"; production does not.
const createCheckableAuth = async () =>
  betterAuth({
    ...createAuthOptions(await createTestPrisma()),
    advanced: { disableOriginCheck: false }
  })

const signUp = (auth: Pick<Auth, 'handler'>, origin?: string) =>
  auth.handler(
    new Request('http://localhost:3000/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(origin ? { origin } : {})
      },
      body: JSON.stringify({
        email: 'lea@example.com',
        password: 'password1234',
        name: 'Léa'
      })
    })
  )

const withEnv = async <Result>(
  vars: Record<string, string>,
  run: () => Promise<Result>
): Promise<Result> => {
  const previous = Object.keys(vars).map(key => [key, process.env[key]] as const)
  for (const [key, value] of Object.entries(vars)) {
    process.env[key] = value
  }

  try {
    return await run()
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

describe('createAuth', () => {
  it('signs a User up and exposes the session User', async () => {
    const auth = await createTestAuth()

    const response = await signUp(auth)

    expect(response.status).toBe(200)
    const cookie = response.headers.getSetCookie().find(cookie => cookie.includes('session_token'))
    expect(cookie).toBeDefined()
    const user = await auth.getSessionUser(new Headers({ cookie: cookie?.split(';')[0] ?? '' }))
    expect(user).toEqual({ id: expect.any(String), name: 'Léa' })
  })

  it('exposes no User without a session', async () => {
    const auth = await createTestAuth()

    const user = await auth.getSessionUser(new Headers())

    expect(user).toBeNull()
  })

  it('trusts the Vite dev origin whatever BETTER_AUTH_URL holds', async () => {
    await withEnv({ BETTER_AUTH_URL: 'https://ardoise.example.com' }, async () => {
      const auth = await createCheckableAuth()

      const devOrigin = await signUp(auth, 'http://localhost:1337')
      const unknownOrigin = await signUp(auth, 'http://evil.example.com')

      expect(devOrigin.status).toBe(200)
      expect(unknownOrigin.status).toBe(403)
    })
  })

  it('trusts the BETTER_AUTH_URL origin', async () => {
    await withEnv({ BETTER_AUTH_URL: 'https://ardoise.example.com' }, async () => {
      const auth = await createCheckableAuth()

      const response = await signUp(auth, 'https://ardoise.example.com')

      expect(response.status).toBe(200)
    })
  })

  it('marks the session cookie Secure when BETTER_AUTH_URL is https', async () => {
    await withEnv({ BETTER_AUTH_URL: 'https://ardoise.example.com' }, async () => {
      const auth = await createTestAuth()

      const response = await signUp(auth)

      const cookie = response.headers
        .getSetCookie()
        .find(cookie => cookie.startsWith('__Secure-better-auth.session_token='))
      expect(cookie).toBeDefined()
      expect(cookie).toContain('Secure')
    })
  })
})
