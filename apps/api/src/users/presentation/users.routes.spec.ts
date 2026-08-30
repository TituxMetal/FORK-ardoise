import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { createPrismaClient } from '~/shared/infrastructure'
import { createApp } from '~/createApp'
import type { GroupDto } from '~/groups/application/group.dto'

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

const signUp = (app: ReturnType<typeof createApp>) =>
  app.request('/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credentials)
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

describe('users', () => {
  it('renames the User and propagates the name to every Member seat', async () => {
    const app = await createTestApp()
    const opened = await signUp(app)
    const cookie = cookieHeader(opened)
    const first = (await (await createGroup(app, cookie, 'Potes de Bob')).json()) as GroupDto
    const second = (await (await createGroup(app, cookie, 'Collègues')).json()) as GroupDto

    const response = await app.request('/users/me', {
      method: 'PATCH',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ name: '  Léa P.  ' })
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ name: 'Léa P.' })

    for (const group of [first, second]) {
      const read = await app.request(`/groups/${group.id}`, { headers: { cookie } })
      const body = (await read.json()) as GroupDto
      expect(body.members).toEqual([{ userId: expect.any(String), name: 'Léa P.' }])
      expect(body.balances).toEqual([{ userId: expect.any(String), name: 'Léa P.', amount: 0 }])
    }
  })

  it('shows the new name in the session of the User', async () => {
    const app = await createTestApp()
    const opened = await signUp(app)
    const cookie = cookieHeader(opened)

    await app.request('/users/me', {
      method: 'PATCH',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Léa P.' })
    })

    const session = await app.request('/auth/get-session', { headers: { cookie } })
    expect(session.status).toBe(200)

    const body = (await session.json()) as { user: { name: string } }
    expect(body.user.name).toBe('Léa P.')
  })

  it('refuses a non-string name with 400 and a blank name with the domain rule', async () => {
    const app = await createTestApp()
    const opened = await signUp(app)
    const cookie = cookieHeader(opened)

    const malformed = await app.request('/users/me', {
      method: 'PATCH',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 42 })
    })

    expect(malformed.status).toBe(400)
    expect(await malformed.json()).toEqual({
      statusCode: 400,
      code: 'INVALID_DATA',
      message: 'Format invalide'
    })

    const blank = await app.request('/users/me', {
      method: 'PATCH',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ name: '   ' })
    })

    expect(blank.status).toBe(400)
    expect(await blank.json()).toEqual({
      statusCode: 400,
      code: 'INVALID_DATA',
      message: 'Nom requis'
    })
  })

  it('refuses to rename without a session with 401', async () => {
    const app = await createTestApp()

    const response = await app.request('/users/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Léa' })
    })

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Session requise'
    })
  })
})
