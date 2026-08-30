import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { amountFromCents } from '~/shared/domain'
import { createPrismaClient } from '~/shared/infrastructure'
import { dayFrom } from '~/expenses/domain/day.vo'
import { expenseCreate } from '~/expenses/domain/expense.entity'
import { prismaExpenseAdapter } from '~/expenses/infrastructure/prismaExpense.adapter'
import { labelFrom } from '~/expenses/domain/label.vo'
import { groupAddMember, groupCreate } from '~/groups/domain/group.entity'
import { groupNameFrom } from '~/groups/domain/groupName.vo'
import { prismaGroupAdapter } from '~/groups/infrastructure/prismaGroup.adapter'
import { memberOf } from '~/groups/domain/member.entity'
import { paybackCreate } from '~/paybacks/domain/payback.entity'
import { prismaPaybackAdapter } from '~/paybacks/infrastructure/prismaPayback.adapter'
import { serviceCreate } from '~/services/domain/service.entity'
import { prismaServiceAdapter } from '~/services/infrastructure/prismaService.adapter'
import { getSlate } from './getSlate.uc'

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

const createTestSlate = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ardoise-'))
  const url = `file:${join(dir, 'test.db')}`
  const sqlite = createClient({ url })
  await sqlite.executeMultiple(
    `${sessionSql}\n${groupSql}\n${groupSecretSql}\n${expenseSql}\n${serviceSql}\n${paybackSql}\n${renameSql}\n${expenseColumnSql}\n${inviteSecretSql}\n${groupIdSql}`
  )
  sqlite.close()
  const prisma = createPrismaClient(url)
  for (const user of [
    { id: 'u1', name: 'Léa', email: 'lea@example.com' },
    { id: 'u2', name: 'Bob', email: 'bob@example.com' },
    { id: 'u3', name: 'Camille', email: 'camille@example.com' }
  ]) {
    await prisma.user.create({ data: { ...user, updatedAt: new Date() } })
  }
  const groups = prismaGroupAdapter(prisma)
  const expenses = prismaExpenseAdapter(prisma)
  const services = prismaServiceAdapter(prisma)
  const paybacks = prismaPaybackAdapter(prisma)
  const group = groupCreate(groupNameFrom('Potes de Bob'), memberOf('u1', 'Léa'))
  groupAddMember(group, memberOf('u2', 'Bob'))
  groupAddMember(group, memberOf('u3', 'Camille'))
  await groups.save(group)
  await expenses.save(
    expenseCreate(group.id, labelFrom('Pizza'), dayFrom('2026-08-15'), amountFromCents(100), 'u1', [
      'u1',
      'u2',
      'u3'
    ])
  )
  await services.save(
    serviceCreate(group.id, labelFrom('Ordi'), dayFrom('2026-08-16'), amountFromCents(50), 'u2', [
      'u1',
      'u2',
      'u3'
    ])
  )
  await paybacks.save(paybackCreate(group.id, 'u3', 'u1', amountFromCents(10), -39, 40))
  return { view: getSlate(groups, expenses, services, paybacks), group }
}

describe('getSlate', () => {
  it('refuses a User who is not a Member with Groupe introuvable', async () => {
    const { view, group } = await createTestSlate()

    const read = view.execute('u4', group.id)

    await expect(read).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Groupe introuvable'
    })
  })

  it('refuses an unknown Group with Groupe introuvable', async () => {
    const { view } = await createTestSlate()

    const read = view.execute('u1', crypto.randomUUID())

    await expect(read).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Groupe introuvable'
    })
  })

  it('returns the Group DTO with its entries and derived Balances', async () => {
    const { view, group } = await createTestSlate()

    const slate = await view.execute('u1', group.id)

    expect(slate).toEqual({
      id: group.id,
      name: 'Potes de Bob',
      selfMemberId: 'u1',
      members: [
        { userId: 'u1', name: 'Léa' },
        { userId: 'u2', name: 'Bob' },
        { userId: 'u3', name: 'Camille' }
      ],
      invite: { secret: group.inviteSecret },
      expenses: [
        {
          id: expect.any(String),
          label: 'Pizza',
          day: '2026-08-15',
          amount: 100,
          payerId: 'u1',
          participantIds: ['u1', 'u2', 'u3'],
          parts: [
            { userId: 'u1', amount: 34 },
            { userId: 'u2', amount: 33 },
            { userId: 'u3', amount: 33 }
          ]
        }
      ],
      services: [
        {
          id: expect.any(String),
          label: 'Ordi',
          day: '2026-08-16',
          amount: 50,
          providerId: 'u2',
          participantIds: ['u1', 'u2', 'u3'],
          parts: [
            { userId: 'u1', amount: 16 },
            { userId: 'u2', amount: 18 },
            { userId: 'u3', amount: 16 }
          ]
        }
      ],
      paybacks: [
        {
          id: expect.any(String),
          debtorId: 'u3',
          creditorId: 'u1',
          amount: 10
        }
      ],
      balances: [
        { userId: 'u1', name: 'Léa', amount: 40 },
        { userId: 'u2', name: 'Bob', amount: -1 },
        { userId: 'u3', name: 'Camille', amount: -39 }
      ]
    })
  })
})
