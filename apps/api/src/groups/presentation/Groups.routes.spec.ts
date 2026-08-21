import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { createPrismaClient } from '~/infrastructure/CreatePrisma.client'
import { createApp } from '~/presentation/CreateApp'
import type { GroupDto } from '~/groups/application/Group.dto'

const sessionSql = readFileSync(
  fileURLToPath(
    new URL('../../../prisma/migrations/20260815130000_session_user/migration.sql', import.meta.url)
  ),
  'utf8'
)
const groupSql = readFileSync(
  fileURLToPath(
    new URL(
      '../../../prisma/migrations/20260815190000_groupe_membre/migration.sql',
      import.meta.url
    )
  ),
  'utf8'
)
const groupSecretSql = readFileSync(
  fileURLToPath(
    new URL(
      '../../../prisma/migrations/20260816042947_invitation_secret/migration.sql',
      import.meta.url
    )
  ),
  'utf8'
)
const expenseSql = readFileSync(
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
const paybackSql = readFileSync(
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

const expenseColumnSql = readFileSync(
  fileURLToPath(
    new URL(
      '../../../prisma/migrations/20260817000000_expense_columns/migration.sql',
      import.meta.url
    )
  ),
  'utf8'
)

const inviteSecretSql = readFileSync(
  fileURLToPath(
    new URL(
      '../../../prisma/migrations/20260818000000_invite_secret/migration.sql',
      import.meta.url
    )
  ),
  'utf8'
)

const groupIdSql = readFileSync(
  fileURLToPath(
    new URL('../../../prisma/migrations/20260818010000_group_id/migration.sql', import.meta.url)
  ),
  'utf8'
)

const createTestApp = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ardoise-'))
  const url = `file:${join(dir, 'test.db')}`
  const sqlite = createClient({ url })
  await sqlite.executeMultiple(
    `${sessionSql}\n${groupSql}\n${groupSecretSql}\n${expenseSql}\n${serviceSql}\n${paybackSql}\n${renameSql}\n${expenseColumnSql}\n${inviteSecretSql}\n${groupIdSql}`
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

const createGroup = (app: ReturnType<typeof createApp>, cookie: string, name: string) =>
  app.request('/groups', {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ name })
  })

describe('groups', () => {
  it('creating a named Group makes the creator the first Member', async () => {
    const app = await createTestApp()
    const opened = await signUp(app)
    const response = await createGroup(app, cookieHeader(opened), 'Potes de Bob')

    expect(response.status).toBe(201)
    const body = (await response.json()) as GroupDto
    expect(body.name).toBe('Potes de Bob')
    expect(body.members).toEqual([{ userId: expect.any(String), name: 'Léa' }])
    expect(body).not.toHaveProperty('admin')
    expect(body.members[0]).not.toHaveProperty('admin')
  })

  it('listing Groups returns only memberships of the session', async () => {
    const app = await createTestApp()
    const lea = await signUp(app)
    const bob = await signUp(app, {
      email: 'bob@example.com',
      password: 'password1234',
      name: 'Bob'
    })
    await createGroup(app, cookieHeader(lea), 'Potes de Bob')
    await createGroup(app, cookieHeader(bob), 'Collègues')

    const response = await app.request('/groups', {
      headers: { cookie: cookieHeader(lea) }
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual([{ id: expect.any(String), name: 'Potes de Bob' }])
  })

  it('reading a Group shows an empty board and Balances at 0', async () => {
    const app = await createTestApp()
    const opened = await signUp(app)
    const created = await createGroup(app, cookieHeader(opened), 'Potes de Bob')
    const { id, members, invite } = (await created.json()) as GroupDto

    const response = await app.request(`/groups/${id}`, {
      headers: { cookie: cookieHeader(opened) }
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id,
      name: 'Potes de Bob',
      members,
      invite,
      expenses: [],
      services: [],
      paybacks: [],
      balances: members.map((member: { userId: string; name: string }) => ({
        ...member,
        amount: 0
      }))
    })
  })

  it('two Groups created by the same User stay distinct', async () => {
    const app = await createTestApp()
    const opened = await signUp(app)
    const cookie = cookieHeader(opened)
    await createGroup(app, cookie, 'Potes de Bob')
    await createGroup(app, cookie, 'Collègues')

    const listed = await app.request('/groups', { headers: { cookie } })
    expect(listed.status).toBe(200)
    expect(await listed.json()).toEqual([
      { id: expect.any(String), name: 'Potes de Bob' },
      { id: expect.any(String), name: 'Collègues' }
    ])
  })

  it('creating a Group with a non-string name is refused with 400', async () => {
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

  it('creating a Group without a session is refused with 401', async () => {
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

  it('a User who is not a Member reads a Group as 404', async () => {
    const app = await createTestApp()
    const lea = await signUp(app)
    const bob = await signUp(app, {
      email: 'bob@example.com',
      password: 'password1234',
      name: 'Bob'
    })
    const created = await createGroup(app, cookieHeader(lea), 'Potes de Bob')
    const { id } = (await created.json()) as GroupDto

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

  it('a Member reads a stable Invite secret on the Group', async () => {
    const app = await createTestApp()
    const opened = await signUp(app)
    const cookie = cookieHeader(opened)
    const created = await createGroup(app, cookie, 'Potes de Bob')
    const { id } = (await created.json()) as GroupDto

    const first = await app.request(`/groups/${id}`, { headers: { cookie } })
    const second = await app.request(`/groups/${id}`, { headers: { cookie } })

    expect(first.status).toBe(200)
    const firstBody = (await first.json()) as GroupDto
    const secondBody = (await second.json()) as GroupDto
    expect(firstBody.invite.secret).toMatch(/^[0-9a-f-]{36}$/)
    expect(secondBody.invite.secret).toBe(firstBody.invite.secret)
  })
})
