import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from '~/groups/application/group.dto'
import { createPrismaClient } from '~/shared/infrastructure'
import { createApp } from '~/createApp'

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

const openApp = async () => {
  const app = await createTestApp()
  const leaRes = await signUp(app)
  const bobRes = await signUp(app, {
    email: 'bob@example.com',
    password: 'password1234',
    name: 'Bob'
  })
  const camilleRes = await signUp(app, {
    email: 'camille@example.com',
    password: 'password1234',
    name: 'Camille'
  })
  const created = await createGroup(app, cookieHeader(leaRes), 'Potes de Bob')
  const createdBody = (await created.json()) as GroupDto
  await app.request(`/invites/${createdBody.invite.secret}`, {
    method: 'POST',
    headers: { cookie: cookieHeader(bobRes) }
  })
  await app.request(`/invites/${createdBody.invite.secret}`, {
    method: 'POST',
    headers: { cookie: cookieHeader(camilleRes) }
  })
  const opened = await app.request(`/groups/${createdBody.id}`, {
    headers: { cookie: cookieHeader(leaRes) }
  })
  const group = (await opened.json()) as GroupDto
  const member = (name: string) => group.members.find(item => item.name === name)!
  return {
    app,
    group,
    lea: { cookie: cookieHeader(leaRes), ...member('Léa') },
    bob: { cookie: cookieHeader(bobRes), ...member('Bob') },
    camille: { cookie: cookieHeader(camilleRes), ...member('Camille') }
  }
}

const createService = (
  app: ReturnType<typeof createApp>,
  cookie: string,
  groupId: string,
  body: Record<string, unknown>
) =>
  app.request(`/groups/${groupId}/services`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })

const createExpense = (
  app: ReturnType<typeof createApp>,
  cookie: string,
  groupId: string,
  body: Record<string, unknown>
) =>
  app.request(`/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })

describe('services', () => {
  it('creates a Service that splits equally and is not an Expense', async () => {
    const { app, group, lea, bob, camille } = await openApp()

    const response = await createService(app, lea.cookie, group.id, {
      label: 'Ordi Bob',
      day: '2026-08-15',
      amount: 100,
      providerId: lea.userId,
      participantIds: [lea.userId, bob.userId, camille.userId]
    })

    expect(response.status).toBe(201)
    const body = (await response.json()) as GroupDto
    expect(body.expenses).toEqual([])
    expect(body.services).toEqual([
      {
        id: expect.any(String),
        label: 'Ordi Bob',
        day: '2026-08-15',
        amount: 100,
        providerId: lea.userId,
        participantIds: [lea.userId, bob.userId, camille.userId],
        parts: [
          { userId: lea.userId, amount: 34 },
          { userId: bob.userId, amount: 33 },
          { userId: camille.userId, amount: 33 }
        ]
      }
    ])
    expect(body.balances).toEqual([
      { userId: lea.userId, name: 'Léa', amount: 66 },
      { userId: bob.userId, name: 'Bob', amount: -33 },
      { userId: camille.userId, name: 'Camille', amount: -33 }
    ])
  })

  it('keeps the remainder with the Provider outside Participants and Balances sum to 0', async () => {
    const { app, group, lea, bob, camille } = await openApp()

    const response = await createService(app, bob.cookie, group.id, {
      label: 'Ordi Bob',
      day: '2026-08-15',
      amount: 100,
      providerId: lea.userId,
      participantIds: [bob.userId, camille.userId]
    })

    expect(response.status).toBe(201)
    const body = (await response.json()) as GroupDto
    expect(body.services[0]?.parts).toEqual([
      { userId: bob.userId, amount: 50 },
      { userId: camille.userId, amount: 50 }
    ])
    expect(body.balances.reduce((sum, balance) => sum + balance.amount, 0)).toBe(0)
    expect(body.balances.find(balance => balance.userId === lea.userId)?.amount).toBe(100)
  })

  it('defaults omitted Participants to every Member', async () => {
    const { app, group, lea } = await openApp()

    const response = await createService(app, lea.cookie, group.id, {
      label: 'Ordi Bob',
      day: '2026-08-15',
      amount: 90,
      providerId: lea.userId
    })

    expect(response.status).toBe(201)
    const body = (await response.json()) as GroupDto
    expect(body.services[0]?.participantIds).toEqual(group.members.map(member => member.userId))
    expect(body.services[0]?.parts.map(part => part.amount)).toEqual([30, 30, 30])
  })

  it('an Expense then a Service in the same Group cancel out', async () => {
    const { app, group, lea, bob, camille } = await openApp()
    const participants = [lea.userId, bob.userId, camille.userId]

    await createExpense(app, lea.cookie, group.id, {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: lea.userId,
      participantIds: participants
    })
    const response = await createService(app, lea.cookie, group.id, {
      label: 'Ordi Bob',
      day: '2026-08-15',
      amount: 100,
      providerId: bob.userId,
      participantIds: participants
    })

    expect(response.status).toBe(201)
    const body = (await response.json()) as GroupDto
    expect(body.expenses).toHaveLength(1)
    expect(body.services).toHaveLength(1)
    expect(body.balances).toEqual([
      { userId: lea.userId, name: 'Léa', amount: 33 },
      { userId: bob.userId, name: 'Bob', amount: 33 },
      { userId: camille.userId, name: 'Camille', amount: -66 }
    ])
  })

  it('any Member can delete a Service; a second delete is 404', async () => {
    const { app, group, lea, bob, camille } = await openApp()
    const created = await createService(app, lea.cookie, group.id, {
      label: 'Ordi Bob',
      day: '2026-08-15',
      amount: 100,
      providerId: lea.userId,
      participantIds: [lea.userId, bob.userId, camille.userId]
    })
    const { services } = (await created.json()) as GroupDto

    const deleted = await app.request(`/groups/${group.id}/services/${services[0]!.id}`, {
      method: 'DELETE',
      headers: { cookie: bob.cookie }
    })
    expect(deleted.status).toBe(200)
    const after = (await deleted.json()) as GroupDto
    expect(after.services).toEqual([])
    expect(after.balances.every(balance => balance.amount === 0)).toBe(true)

    const second = await app.request(`/groups/${group.id}/services/${services[0]!.id}`, {
      method: 'DELETE',
      headers: { cookie: lea.cookie }
    })
    expect(second.status).toBe(404)
    expect(await second.json()).toEqual({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Service introuvable'
    })
  })

  it('edits a Service with PATCH, re-deriving the split and the Balances', async () => {
    const { app, group, lea, bob, camille } = await openApp()
    const created = await createService(app, lea.cookie, group.id, {
      label: 'Ordi Bob',
      day: '2026-08-15',
      amount: 100,
      providerId: lea.userId,
      participantIds: [lea.userId, bob.userId, camille.userId]
    })
    const { services } = (await created.json()) as GroupDto

    const response = await app.request(`/groups/${group.id}/services/${services[0]!.id}`, {
      method: 'PATCH',
      headers: { cookie: lea.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({
        label: 'Ordi Neuf',
        day: '2026-08-16',
        amount: 200,
        providerId: bob.userId,
        participantIds: [bob.userId, camille.userId]
      })
    })

    expect(response.status).toBe(200)
    const body = (await response.json()) as GroupDto
    expect(body.services).toEqual([
      {
        id: services[0]!.id,
        label: 'Ordi Neuf',
        day: '2026-08-16',
        amount: 200,
        providerId: bob.userId,
        participantIds: [bob.userId, camille.userId],
        parts: [
          { userId: bob.userId, amount: 100 },
          { userId: camille.userId, amount: 100 }
        ]
      }
    ])
    expect(body.balances).toEqual([
      { userId: lea.userId, name: 'Léa', amount: 0 },
      { userId: bob.userId, name: 'Bob', amount: 100 },
      { userId: camille.userId, name: 'Camille', amount: -100 }
    ])
  })

  it('refuses to edit a Service of another Group with 404', async () => {
    const { app, group, lea, bob, camille } = await openApp()
    const other = await createGroup(app, lea.cookie, 'Collègues')
    const otherBody = (await other.json()) as GroupDto
    const created = await createService(app, lea.cookie, group.id, {
      label: 'Ordi Bob',
      day: '2026-08-15',
      amount: 100,
      providerId: lea.userId,
      participantIds: [lea.userId, bob.userId, camille.userId]
    })
    const { services } = (await created.json()) as GroupDto

    const response = await app.request(`/groups/${otherBody.id}/services/${services[0]!.id}`, {
      method: 'PATCH',
      headers: { cookie: lea.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({
        label: 'Ordi Bob',
        day: '2026-08-15',
        amount: 100,
        providerId: lea.userId,
        participantIds: [lea.userId]
      })
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Service introuvable'
    })
  })

  it('refuses a malformed PATCH body or an unknown Provider with 400', async () => {
    const { app, group, lea, bob, camille } = await openApp()
    const created = await createService(app, lea.cookie, group.id, {
      label: 'Ordi Bob',
      day: '2026-08-15',
      amount: 100,
      providerId: lea.userId,
      participantIds: [lea.userId, bob.userId, camille.userId]
    })
    const { services } = (await created.json()) as GroupDto
    const refusals = [
      {
        body: { day: '2026-08-15', amount: 100, providerId: lea.userId },
        message: 'Format invalide'
      },
      {
        body: {
          label: 'Ordi Bob',
          day: '2026-08-15',
          amount: 100,
          providerId: 'inconnu',
          participantIds: [lea.userId]
        },
        message: 'Membre introuvable'
      }
    ]

    for (const refusal of refusals) {
      const response = await app.request(`/groups/${group.id}/services/${services[0]!.id}`, {
        method: 'PATCH',
        headers: { cookie: lea.cookie, 'content-type': 'application/json' },
        body: JSON.stringify(refusal.body)
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        statusCode: 400,
        code: 'INVALID_DATA',
        message: refusal.message
      })
    }

    const listed = await app.request(`/groups/${group.id}`, { headers: { cookie: bob.cookie } })
    expect(((await listed.json()) as GroupDto).services).toEqual([
      expect.objectContaining({ label: 'Ordi Bob' })
    ])
  })

  it('rejects malformed shape, a non-integer or non-positive Amount, or empty Participants with 400', async () => {
    const { app, group, lea, bob } = await openApp()
    const cookie = lea.cookie
    const refusals = [
      {
        body: {
          day: '2026-08-15',
          amount: 100,
          providerId: lea.userId,
          participantIds: [lea.userId]
        },
        message: 'Format invalide'
      },
      {
        body: {
          label: 42,
          day: '2026-08-15',
          amount: 100,
          providerId: lea.userId,
          participantIds: [lea.userId]
        },
        message: 'Format invalide'
      },
      {
        body: {
          label: 'Ordi Bob',
          amount: 100,
          providerId: lea.userId,
          participantIds: [lea.userId]
        },
        message: 'Format invalide'
      },
      {
        body: {
          label: 'Ordi Bob',
          day: '2026-08-15',
          amount: 0,
          providerId: lea.userId,
          participantIds: [lea.userId]
        },
        message: 'Montant en centimes > 0 requis'
      },
      {
        body: {
          label: 'Ordi Bob',
          day: '2026-08-15',
          amount: 1.5,
          providerId: lea.userId,
          participantIds: [lea.userId]
        },
        message: 'Montant en centimes entiers requis'
      },
      {
        body: {
          label: 'Ordi Bob',
          day: '2026-08-15',
          amount: 100,
          providerId: lea.userId,
          participantIds: []
        },
        message: 'Au moins un Participant requis'
      }
    ]

    for (const refusal of refusals) {
      const response = await createService(app, cookie, group.id, refusal.body)
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        statusCode: 400,
        code: 'INVALID_DATA',
        message: refusal.message
      })
    }

    const listed = await app.request(`/groups/${group.id}`, { headers: { cookie: bob.cookie } })
    expect(((await listed.json()) as GroupDto).services).toEqual([])
  })
})
