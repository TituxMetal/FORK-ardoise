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
const invitationSql = readFileSync(
  fileURLToPath(
    new URL(
      '../../../prisma/migrations/20260816042947_invitation_secret/migration.sql',
      import.meta.url
    )
  ),
  'utf8'
)
const depenseSql = readFileSync(
  fileURLToPath(
    new URL('../../../prisma/migrations/20260816052720_depense/migration.sql', import.meta.url)
  ),
  'utf8'
)
const serviceSql = readFileSync(
  fileURLToPath(
    new URL('../../../prisma/migrations/20260816061030_service/migration.sql', import.meta.url)
  ),
  'utf8'
)
const reglementSql = readFileSync(
  fileURLToPath(
    new URL('../../../prisma/migrations/20260816070637_reglement/migration.sql', import.meta.url)
  ),
  'utf8'
)

const renameSql = readFileSync(
  fileURLToPath(
    new URL(
      '../../../prisma/migrations/20260816153023_rename_to_glossary/migration.sql',
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

test('a User with a session who opens the Invitation becomes Membre', async () => {
  const app = await createTestApp()
  const lea = await signUp(app)
  const bob = await signUp(app, {
    email: 'bob@example.com',
    password: 'password1234',
    name: 'Bob'
  })
  const created = await createGroupe(app, cookieHeader(lea), 'Potes de Bob')
  const { invitation } = (await created.json()) as GroupeDto

  const joined = await app.request(`/invitations/${invitation.secret}`, {
    method: 'POST',
    headers: { cookie: cookieHeader(bob) }
  })

  expect(joined.status).toBe(200)
  const body = (await joined.json()) as GroupeDto
  expect(body.name).toBe('Potes de Bob')
  expect(body.members).toEqual([
    { userId: expect.any(String), name: 'Léa' },
    { userId: expect.any(String), name: 'Bob' }
  ])

  const listed = await app.request('/groups', {
    headers: { cookie: cookieHeader(bob) }
  })
  expect(await listed.json()).toEqual([{ id: body.id, name: 'Potes de Bob' }])
})

test('opening the Invitation as an existing Membre leaves a single Membre', async () => {
  const app = await createTestApp()
  const lea = await signUp(app)
  const cookie = cookieHeader(lea)
  const created = await createGroupe(app, cookie, 'Potes de Bob')
  const { invitation } = (await created.json()) as GroupeDto

  const joined = await app.request(`/invitations/${invitation.secret}`, {
    method: 'POST',
    headers: { cookie }
  })

  expect(joined.status).toBe(200)
  const body = (await joined.json()) as GroupeDto
  expect(body.members).toEqual([{ userId: expect.any(String), name: 'Léa' }])
})

test('opening the Invitation without a session does not write', async () => {
  const app = await createTestApp()
  const lea = await signUp(app)
  const created = await createGroupe(app, cookieHeader(lea), 'Potes de Bob')
  const { id, invitation } = (await created.json()) as GroupeDto

  const response = await app.request(`/invitations/${invitation.secret}`, {
    method: 'POST'
  })

  expect(response.status).toBe(401)
  expect(await response.json()).toEqual({
    statusCode: 401,
    code: 'UNAUTHORIZED',
    message: 'Session requise'
  })

  const after = await app.request(`/groups/${id}`, {
    headers: { cookie: cookieHeader(lea) }
  })
  const body = (await after.json()) as GroupeDto
  expect(body.members).toEqual([{ userId: expect.any(String), name: 'Léa' }])
})

test('a User without the Invitation secret cannot join', async () => {
  const app = await createTestApp()
  const bob = await signUp(app, {
    email: 'bob@example.com',
    password: 'password1234',
    name: 'Bob'
  })

  const response = await app.request(`/invitations/${crypto.randomUUID()}`, {
    method: 'POST',
    headers: { cookie: cookieHeader(bob) }
  })

  expect(response.status).toBe(404)
  expect(await response.json()).toEqual({
    statusCode: 404,
    code: 'NOT_FOUND',
    message: 'Invitation introuvable'
  })
})
