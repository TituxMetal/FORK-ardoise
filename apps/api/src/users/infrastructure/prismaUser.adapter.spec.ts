import type { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { createPrismaClient } from '~/shared/infrastructure/prisma.client'
import { prismaUserAdapter } from './prismaUser.adapter'

const sql = (migration: string): string => {
  const url = new URL(`../../../prisma/migrations/${migration}/migration.sql`, import.meta.url)
  return readFileSync(fileURLToPath(url), 'utf8')
}

const createTestDb = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ardoise-user-'))
  const url = `file:${join(dir, 'test.db')}`
  const sqlite = createClient({ url })
  await sqlite.executeMultiple(
    `${sql('20260815130000_session_user')}\n${sql('20260815190000_groupe_membre')}\n${sql('20260816042947_invitation_secret')}\n${sql('20260816052720_depense')}\n${sql('20260816061030_service')}\n${sql('20260816070637_reglement')}\n${sql('20260816153023_rename_to_glossary')}\n${sql('20260817000000_expense_columns')}\n${sql('20260818000000_invite_secret')}\n${sql('20260818010000_group_id')}`
  )
  sqlite.close()
  return createPrismaClient(url)
}

const seed = async (prisma: PrismaClient) => {
  await prisma.user.create({
    data: { id: 'u-lea', name: 'Léa', email: 'lea@example.com', emailVerified: true }
  })
  await prisma.user.create({
    data: { id: 'u-bob', name: 'Bob', email: 'bob@example.com', emailVerified: true }
  })
  for (const groupId of ['g1', 'g2']) {
    await prisma.group.create({ data: { id: groupId, name: 'Groupe', inviteSecret: groupId } })
  }
  await prisma.member.create({
    data: { id: 'm1', userId: 'u-lea', groupId: 'g1', name: 'Léa' }
  })
  await prisma.member.create({
    data: { id: 'm2', userId: 'u-lea', groupId: 'g2', name: 'Léa' }
  })
  await prisma.member.create({
    data: { id: 'm3', userId: 'u-bob', groupId: 'g1', name: 'Bob' }
  })
}

describe('prismaUserAdapter', () => {
  it('renames the User and every Member seat they sit in', async () => {
    const prisma = await createTestDb()
    await seed(prisma)
    const adapter = prismaUserAdapter(prisma)

    await adapter.rename('u-lea', 'Léa P.')

    const user = await prisma.user.findUnique({ where: { id: 'u-lea' } })
    expect(user?.name).toBe('Léa P.')
    const seats = await prisma.member.findMany({
      where: { userId: 'u-lea' },
      orderBy: { groupId: 'asc' }
    })
    expect(seats.map(seat => seat.name)).toEqual(['Léa P.', 'Léa P.'])
  })

  it('leaves the other Users and their seats untouched', async () => {
    const prisma = await createTestDb()
    await seed(prisma)
    const adapter = prismaUserAdapter(prisma)

    await adapter.rename('u-lea', 'Léa P.')

    const bob = await prisma.user.findUnique({ where: { id: 'u-bob' } })
    expect(bob?.name).toBe('Bob')
    const bobSeats = await prisma.member.findMany({ where: { userId: 'u-bob' } })
    expect(bobSeats.map(seat => seat.name)).toEqual(['Bob'])
  })
})
