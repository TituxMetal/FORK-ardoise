import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { createAuth } from './auth.adapter'
import { createPrismaClient } from './prisma.client'

const sessionSql = readFileSync(
  fileURLToPath(
    new URL('../../../prisma/migrations/20260815130000_session_user/migration.sql', import.meta.url)
  ),
  'utf8'
)

const createTestAuth = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ardoise-auth-'))
  const url = `file:${join(dir, 'test.db')}`
  const sqlite = createClient({ url })
  await sqlite.executeMultiple(sessionSql)
  sqlite.close()
  return createAuth(createPrismaClient(url))
}

describe('createAuth', () => {
  it('signs a User up and exposes the session User', async () => {
    const auth = await createTestAuth()

    const response = await auth.handler(
      new Request('http://localhost:3000/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'lea@example.com',
          password: 'password1234',
          name: 'Léa'
        })
      })
    )

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
})
