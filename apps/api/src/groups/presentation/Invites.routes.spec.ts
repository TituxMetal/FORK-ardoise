import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { createPrismaClient } from '~/shared/infrastructure'
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

describe('invites', () => {
  it('a User with a session who opens the Invite becomes a Member', async () => {
    const app = await createTestApp()
    const lea = await signUp(app)
    const bob = await signUp(app, {
      email: 'bob@example.com',
      password: 'password1234',
      name: 'Bob'
    })
    const created = await createGroup(app, cookieHeader(lea), 'Potes de Bob')
    const { invite } = (await created.json()) as GroupDto

    const joined = await app.request(`/invites/${invite.secret}`, {
      method: 'POST',
      headers: { cookie: cookieHeader(bob) }
    })

    expect(joined.status).toBe(200)
    const body = (await joined.json()) as GroupDto
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

  it('opening the Invite as an existing Member leaves a single Member', async () => {
    const app = await createTestApp()
    const lea = await signUp(app)
    const cookie = cookieHeader(lea)
    const created = await createGroup(app, cookie, 'Potes de Bob')
    const { invite } = (await created.json()) as GroupDto

    const joined = await app.request(`/invites/${invite.secret}`, {
      method: 'POST',
      headers: { cookie }
    })

    expect(joined.status).toBe(200)
    const body = (await joined.json()) as GroupDto
    expect(body.members).toEqual([{ userId: expect.any(String), name: 'Léa' }])
  })

  it('opening the Invite without a session does not write', async () => {
    const app = await createTestApp()
    const lea = await signUp(app)
    const created = await createGroup(app, cookieHeader(lea), 'Potes de Bob')
    const { id, invite } = (await created.json()) as GroupDto

    const response = await app.request(`/invites/${invite.secret}`, {
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
    const body = (await after.json()) as GroupDto
    expect(body.members).toEqual([{ userId: expect.any(String), name: 'Léa' }])
  })

  it('a User without the Invite secret cannot join', async () => {
    const app = await createTestApp()
    const bob = await signUp(app, {
      email: 'bob@example.com',
      password: 'password1234',
      name: 'Bob'
    })

    const response = await app.request(`/invites/${crypto.randomUUID()}`, {
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
})
