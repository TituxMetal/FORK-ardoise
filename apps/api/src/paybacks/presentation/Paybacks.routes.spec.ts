import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from '../../groups/application/Group.dto.ts'
import { createPrismaClient } from '../../infrastructure/CreatePrisma.client.ts'
import { createApp } from '../../presentation/CreateApp.ts'
import {
  PAYBACK_ABOVE_CAP,
  PAYBACK_CREDITOR_NOT_POSITIVE,
  PAYBACK_DEBTOR_NOT_NEGATIVE
} from '../domain/Payback.entity.ts'

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

const createPayback = (
  app: ReturnType<typeof createApp>,
  cookie: string,
  groupId: string,
  body: Record<string, unknown>
) =>
  app.request(`/groups/${groupId}/paybacks`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })

const pizza = async () => {
  const fixture = await openApp()
  await createExpense(fixture.app, fixture.lea.cookie, fixture.group.id, {
    label: 'Pizza',
    day: '2026-08-15',
    amount: 100,
    payerId: fixture.lea.userId,
    participantIds: [fixture.lea.userId, fixture.bob.userId, fixture.camille.userId]
  })
  return fixture
}

describe('paybacks', () => {
  it('records a partial payback under the cap as real money, not an expense', async () => {
    const { app, group, lea, bob, camille } = await pizza()

    const response = await createPayback(app, bob.cookie, group.id, {
      debtorId: bob.userId,
      creditorId: lea.userId,
      amount: 20
    })

    expect(response.status).toBe(201)
    const body = (await response.json()) as GroupDto
    expect(body.expenses).toHaveLength(1)
    expect(body.paybacks).toEqual([
      {
        id: expect.any(String),
        debtorId: bob.userId,
        creditorId: lea.userId,
        amount: 20
      }
    ])
    expect(body.balances).toEqual([
      { userId: lea.userId, name: 'Léa', amount: 46 },
      { userId: bob.userId, name: 'Bob', amount: -13 },
      { userId: camille.userId, name: 'Camille', amount: -33 }
    ])
    expect(body.balances.reduce((sum, balance) => sum + balance.amount, 0)).toBe(0)
  })

  it('lets any member record a payback at the cap', async () => {
    const { app, group, lea, bob, camille } = await pizza()

    const response = await createPayback(app, camille.cookie, group.id, {
      debtorId: bob.userId,
      creditorId: lea.userId,
      amount: 33
    })

    expect(response.status).toBe(201)
    const body = (await response.json()) as GroupDto
    expect(body.paybacks[0]?.amount).toBe(33)
    expect(body.balances).toEqual([
      { userId: lea.userId, name: 'Léa', amount: 33 },
      { userId: bob.userId, name: 'Bob', amount: 0 },
      { userId: camille.userId, name: 'Camille', amount: -33 }
    ])
  })

  it('refuses a payback above the cap, a non-negative debtor or a non-positive creditor', async () => {
    const { app, group, lea, bob, camille } = await pizza()
    const refusals = [
      {
        body: { debtorId: bob.userId, creditorId: lea.userId, amount: 34 },
        message: PAYBACK_ABOVE_CAP
      },
      {
        body: { debtorId: lea.userId, creditorId: bob.userId, amount: 10 },
        message: PAYBACK_DEBTOR_NOT_NEGATIVE
      },
      {
        body: { debtorId: bob.userId, creditorId: camille.userId, amount: 10 },
        message: PAYBACK_CREDITOR_NOT_POSITIVE
      },
      {
        body: { debtorId: 'inconnu', creditorId: lea.userId, amount: 10 },
        message: 'Membre introuvable'
      }
    ]

    for (const refusal of refusals) {
      const response = await createPayback(app, lea.cookie, group.id, refusal.body)
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        statusCode: 400,
        code: 'INVALID_DATA',
        message: refusal.message
      })
    }

    const listed = await app.request(`/groups/${group.id}`, { headers: { cookie: lea.cookie } })
    expect(((await listed.json()) as GroupDto).paybacks).toEqual([])
  })

  it('lets any member delete a payback; a second delete is 404', async () => {
    const { app, group, lea, bob, camille } = await pizza()
    const created = await createPayback(app, lea.cookie, group.id, {
      debtorId: bob.userId,
      creditorId: lea.userId,
      amount: 20
    })
    const { paybacks } = (await created.json()) as GroupDto

    const deleted = await app.request(`/groups/${group.id}/paybacks/${paybacks[0]!.id}`, {
      method: 'DELETE',
      headers: { cookie: camille.cookie }
    })
    expect(deleted.status).toBe(200)
    const after = (await deleted.json()) as GroupDto
    expect(after.paybacks).toEqual([])
    expect(after.balances).toEqual([
      { userId: lea.userId, name: 'Léa', amount: 66 },
      { userId: bob.userId, name: 'Bob', amount: -33 },
      { userId: camille.userId, name: 'Camille', amount: -33 }
    ])

    const second = await app.request(`/groups/${group.id}/paybacks/${paybacks[0]!.id}`, {
      method: 'DELETE',
      headers: { cookie: lea.cookie }
    })
    expect(second.status).toBe(404)
    expect(await second.json()).toEqual({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Règlement introuvable'
    })
  })
})
