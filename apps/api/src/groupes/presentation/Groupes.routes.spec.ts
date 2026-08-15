import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vite-plus/test'
import { createPrismaClient } from '../../infrastructure/CreatePrisma.client.ts'
import { createApp } from '../../presentation/CreateApp.ts'
import type { GroupeDto } from '../application/Groupe.dto.ts'

const sessionSql = readFileSync(
  fileURLToPath(
    new URL('../../../prisma/migrations/20260815130000_session_user/migration.sql', import.meta.url)
  ),
  'utf8'
)
const groupeSql = readFileSync(
  fileURLToPath(
    new URL(
      '../../../prisma/migrations/20260815190000_groupe_membre/migration.sql',
      import.meta.url
    )
  ),
  'utf8'
)

const createTestApp = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ardoise-'))
  const url = `file:${join(dir, 'test.db')}`
  const sqlite = createClient({ url })
  await sqlite.executeMultiple(`${sessionSql}\n${groupeSql}`)
  sqlite.close()
  return createApp(createPrismaClient(url))
}

const credentials = {
  email: 'lea@example.com',
  password: 'password1234',
  name: 'Léa'
}

const signUp = (app: ReturnType<typeof createApp>, user = credentials) =>
  app.request('/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(user)
  })

const sessionCookie = (response: Response) =>
  response.headers.getSetCookie().find(cookie => cookie.includes('session_token'))

const cookieHeader = (response: Response) => sessionCookie(response)?.split(';')[0] ?? ''

const createGroupe = (app: ReturnType<typeof createApp>, cookie: string, name: string) =>
  app.request('/groups', {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ name })
  })

test('creating a named Groupe makes the creator the first Membre', async () => {
  const app = await createTestApp()
  const opened = await signUp(app)
  const response = await createGroupe(app, cookieHeader(opened), 'Potes de Bob')

  expect(response.status).toBe(201)
  const body = (await response.json()) as GroupeDto
  expect(body.name).toBe('Potes de Bob')
  expect(body.members).toEqual([{ userId: expect.any(String), name: 'Léa' }])
  expect(body).not.toHaveProperty('admin')
  expect(body.members[0]).not.toHaveProperty('admin')
})

test('listing Groupes returns only memberships of the session', async () => {
  const app = await createTestApp()
  const lea = await signUp(app)
  const bob = await signUp(app, {
    email: 'bob@example.com',
    password: 'password1234',
    name: 'Bob'
  })
  await createGroupe(app, cookieHeader(lea), 'Potes de Bob')
  await createGroupe(app, cookieHeader(bob), 'Collègues')

  const response = await app.request('/groups', {
    headers: { cookie: cookieHeader(lea) }
  })

  expect(response.status).toBe(200)
  const body = await response.json()
  expect(body).toEqual([{ id: expect.any(String), name: 'Potes de Bob' }])
})

test('reading a Groupe shows an empty ardoise and Soldes at 0', async () => {
  const app = await createTestApp()
  const opened = await signUp(app)
  const created = await createGroupe(app, cookieHeader(opened), 'Potes de Bob')
  const { id, members } = (await created.json()) as GroupeDto

  const response = await app.request(`/groups/${id}`, {
    headers: { cookie: cookieHeader(opened) }
  })

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    id,
    name: 'Potes de Bob',
    members,
    expenses: [],
    services: [],
    settlements: [],
    balances: members.map((membre: { userId: string; name: string }) => ({
      ...membre,
      amount: 0
    }))
  })
})

test('two Groupes created by the same User stay distinct', async () => {
  const app = await createTestApp()
  const opened = await signUp(app)
  const cookie = cookieHeader(opened)
  await createGroupe(app, cookie, 'Potes de Bob')
  await createGroupe(app, cookie, 'Collègues')

  const listed = await app.request('/groups', { headers: { cookie } })
  expect(listed.status).toBe(200)
  expect(await listed.json()).toEqual([
    { id: expect.any(String), name: 'Potes de Bob' },
    { id: expect.any(String), name: 'Collègues' }
  ])
})

test('creating a Groupe with a non-string name is refused with 400', async () => {
  const app = await createTestApp()
  const opened = await signUp(app)
  const response = await app.request('/groups', {
    method: 'POST',
    headers: { cookie: cookieHeader(opened), 'content-type': 'application/json' },
    body: JSON.stringify({ name: 1 })
  })

  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({
    statusCode: 400,
    code: 'INVALID_DATA',
    message: 'Nom du Groupe requis'
  })
})

test('creating a Groupe without a session is refused with 401', async () => {
  const app = await createTestApp()
  const response = await app.request('/groups', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Potes de Bob' })
  })

  expect(response.status).toBe(401)
  expect(await response.json()).toEqual({
    statusCode: 401,
    code: 'UNAUTHORIZED',
    message: 'Session requise'
  })
})

test('a User who is not Membre reads a Groupe as 404', async () => {
  const app = await createTestApp()
  const lea = await signUp(app)
  const bob = await signUp(app, {
    email: 'bob@example.com',
    password: 'password1234',
    name: 'Bob'
  })
  const created = await createGroupe(app, cookieHeader(lea), 'Potes de Bob')
  const { id } = (await created.json()) as GroupeDto

  const response = await app.request(`/groups/${id}`, {
    headers: { cookie: cookieHeader(bob) }
  })

  expect(response.status).toBe(404)
  expect(await response.json()).toEqual({
    statusCode: 404,
    code: 'NOT_FOUND',
    message: 'Groupe introuvable'
  })
})
