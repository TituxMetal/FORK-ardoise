import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vite-plus/test'
import { createPrismaClient } from '../infrastructure/CreatePrisma.client.ts'
import { createApp } from './CreateApp.ts'

const sessionSql = readFileSync(
  fileURLToPath(
    new URL('../../prisma/migrations/20260815130000_session_user/migration.sql', import.meta.url)
  ),
  'utf8'
)
const groupeSql = readFileSync(
  fileURLToPath(
    new URL('../../prisma/migrations/20260815190000_groupe_membre/migration.sql', import.meta.url)
  ),
  'utf8'
)
const invitationSql = readFileSync(
  fileURLToPath(
    new URL(
      '../../prisma/migrations/20260816042947_invitation_secret/migration.sql',
      import.meta.url
    )
  ),
  'utf8'
)
const depenseSql = readFileSync(
  fileURLToPath(
    new URL('../../prisma/migrations/20260816052720_depense/migration.sql', import.meta.url)
  ),
  'utf8'
)
const serviceSql = readFileSync(
  fileURLToPath(
    new URL('../../prisma/migrations/20260816061030_service/migration.sql', import.meta.url)
  ),
  'utf8'
)
const reglementSql = readFileSync(
  fileURLToPath(
    new URL('../../prisma/migrations/20260816070637_reglement/migration.sql', import.meta.url)
  ),
  'utf8'
)

const renameSql = readFileSync(
  fileURLToPath(
    new URL(
      '../../prisma/migrations/20260816153023_rename_to_glossary/migration.sql',
      import.meta.url
    )
  ),
  'utf8'
)

const createTestApp = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ardoise-'))
  const url = `file:${join(dir, 'test.db')}`
  const sqlite = createClient({ url })
  await sqlite.executeMultiple(
    `${sessionSql}\n${groupeSql}\n${invitationSql}\n${depenseSql}\n${serviceSql}\n${reglementSql}\n${renameSql}`
  )
  sqlite.close()
  return createApp(createPrismaClient(url))
}

const credentials = {
  email: 'lea@example.com',
  password: 'password1234',
  name: 'Léa'
}

const signUp = (app: ReturnType<typeof createApp>) =>
  app.request('/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credentials)
  })

const sessionCookie = (response: Response) =>
  response.headers.getSetCookie().find(cookie => cookie.includes('session_token'))

const cookieHeader = (response: Response) => sessionCookie(response)?.split(';')[0] ?? ''

test('ping responds 200', async () => {
  const app = await createTestApp()
  const response = await app.request('/ping')
  expect(response.status).toBe(200)
})

test('sign-up creates a User and sets an httpOnly session cookie', async () => {
  const app = await createTestApp()
  const response = await signUp(app)

  expect(response.status).toBe(200)
  const cookie = sessionCookie(response)
  expect(cookie).toBeDefined()
  expect(cookie).toMatch(/HttpOnly/i)
})

test('sign-in with the same credentials sets an httpOnly session cookie', async () => {
  const app = await createTestApp()
  await signUp(app)

  const response = await app.request('/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password
    })
  })

  expect(response.status).toBe(200)
  const cookie = sessionCookie(response)
  expect(cookie).toBeDefined()
  expect(cookie).toMatch(/HttpOnly/i)
})

test('sign-out invalidates the session cookie', async () => {
  const app = await createTestApp()
  const opened = await signUp(app)

  const closed = await app.request('/auth/sign-out', {
    method: 'POST',
    headers: { cookie: cookieHeader(opened) }
  })

  expect(closed.status).toBe(200)
  const write = await app.request('/groups', {
    method: 'POST',
    headers: { cookie: cookieHeader(closed) || cookieHeader(opened) }
  })
  expect(write.status).toBe(401)
})

test('write without a session is refused with 401', async () => {
  const app = await createTestApp()
  const response = await app.request('/groups', { method: 'POST' })

  expect(response.status).toBe(401)
  expect(await response.json()).toEqual({
    statusCode: 401,
    code: 'UNAUTHORIZED',
    message: 'Session requise'
  })
})

test('write with a session reaches the use-case', async () => {
  const app = await createTestApp()
  const opened = await signUp(app)
  const response = await app.request('/groups', {
    method: 'POST',
    headers: { cookie: cookieHeader(opened), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Potes de Bob' })
  })
  expect(response.status).toBe(201)
})
