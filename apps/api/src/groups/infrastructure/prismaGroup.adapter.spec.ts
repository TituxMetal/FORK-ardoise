import type { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { groupReconstitute, groupNameReconstitute, memberOf } from '../domain'
import { createPrismaClient } from '~/shared/infrastructure'
import { prismaGroupAdapter } from './prismaGroup.adapter'

const sql = (migration: string): string => {
  const url = new URL(`../../../prisma/migrations/${migration}/migration.sql`, import.meta.url)
  return readFileSync(fileURLToPath(url), 'utf8')
}

const createTestDb = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ardoise-group-'))
  const url = `file:${join(dir, 'test.db')}`
  const sqlite = createClient({ url })
  await sqlite.executeMultiple(
    `${sql('20260815130000_session_user')}\n${sql('20260815190000_groupe_membre')}\n${sql('20260816042947_invitation_secret')}\n${sql('20260816052720_depense')}\n${sql('20260816061030_service')}\n${sql('20260816070637_reglement')}\n${sql('20260816153023_rename_to_glossary')}\n${sql('20260817000000_expense_columns')}\n${sql('20260818000000_invite_secret')}\n${sql('20260818010000_group_id')}`
  )
  sqlite.close()
  return createPrismaClient(url)
}

const seedUser = async (prisma: PrismaClient, id: string, name: string) => {
  await prisma.user.create({
    data: { id, name, email: `${id}@example.com`, emailVerified: true }
  })
}

const potes = groupReconstitute(
  'g1',
  groupNameReconstitute('Potes de Bob'),
  [memberOf('u-lea', 'Léa'), memberOf('u-bob', 'Bob')],
  'secret-1'
)
const coworkers = groupReconstitute(
  'g2',
  groupNameReconstitute('Collègues'),
  [memberOf('u-lea', 'Léa'), memberOf('u-camille', 'Camille')],
  'secret-2'
)

describe('prismaGroupAdapter', () => {
  it('saves a new Group and reads it back with its Members', async () => {
    const prisma = await createTestDb()
    await seedUser(prisma, 'u-lea', 'Léa')
    await seedUser(prisma, 'u-bob', 'Bob')
    const adapter = prismaGroupAdapter(prisma)

    await adapter.save(potes)

    expect(await adapter.findById('g1')).toEqual(potes)
  })

  it('returns null for an unknown Group', async () => {
    const prisma = await createTestDb()
    const adapter = prismaGroupAdapter(prisma)

    const found = await adapter.findById('missing')

    expect(found).toBeNull()
  })

  it('finds the Groups a User sits in', async () => {
    const prisma = await createTestDb()
    await seedUser(prisma, 'u-lea', 'Léa')
    await seedUser(prisma, 'u-bob', 'Bob')
    await seedUser(prisma, 'u-camille', 'Camille')
    const adapter = prismaGroupAdapter(prisma)
    await adapter.save(potes)
    await adapter.save(coworkers)

    const leas = await adapter.findByUserId('u-lea')
    const bobs = await adapter.findByUserId('u-bob')

    expect(leas).toEqual([potes, coworkers])
    expect(bobs).toEqual([potes])
  })

  it('finds a Group by its Invite secret', async () => {
    const prisma = await createTestDb()
    await seedUser(prisma, 'u-lea', 'Léa')
    await seedUser(prisma, 'u-bob', 'Bob')
    const adapter = prismaGroupAdapter(prisma)
    await adapter.save(potes)

    const found = await adapter.findByInviteSecret('secret-1')
    const unknown = await adapter.findByInviteSecret('missing')

    expect(found).toEqual(potes)
    expect(unknown).toBeNull()
  })

  it('adds only the new Member when saving an existing Group', async () => {
    const prisma = await createTestDb()
    await seedUser(prisma, 'u-lea', 'Léa')
    await seedUser(prisma, 'u-bob', 'Bob')
    await seedUser(prisma, 'u-camille', 'Camille')
    const adapter = prismaGroupAdapter(prisma)
    await adapter.save(potes)
    const joined = groupReconstitute(
      'g1',
      groupNameReconstitute('Potes de Bob'),
      [memberOf('u-lea', 'Léa'), memberOf('u-bob', 'Bob'), memberOf('u-camille', 'Camille')],
      'secret-1'
    )

    await adapter.save(joined)

    expect(await adapter.findById('g1')).toEqual(joined)
  })

  it('renames the Group in the database', async () => {
    const prisma = await createTestDb()
    await seedUser(prisma, 'u-lea', 'Léa')
    await seedUser(prisma, 'u-bob', 'Bob')
    const adapter = prismaGroupAdapter(prisma)
    await adapter.save(potes)

    await adapter.rename('g1', 'Soirée de Bob')

    const renamed = await adapter.findById('g1')
    expect(renamed?.name.value).toBe('Soirée de Bob')
    expect(renamed?.members).toEqual(potes.members)
  })

  it('removes one Member seat and keeps the others', async () => {
    const prisma = await createTestDb()
    await seedUser(prisma, 'u-lea', 'Léa')
    await seedUser(prisma, 'u-bob', 'Bob')
    const adapter = prismaGroupAdapter(prisma)
    await adapter.save(potes)

    await adapter.leave('g1', 'u-bob')

    const remaining = await adapter.findById('g1')
    expect(remaining?.members).toEqual([memberOf('u-lea', 'Léa')])
  })

  it('deletes the Group when the leaver was its last Member', async () => {
    const prisma = await createTestDb()
    await seedUser(prisma, 'u-lea', 'Léa')
    await seedUser(prisma, 'u-bob', 'Bob')
    const adapter = prismaGroupAdapter(prisma)
    await adapter.save(potes)

    await adapter.leave('g1', 'u-bob')
    await adapter.leave('g1', 'u-lea')

    expect(await adapter.findById('g1')).toBeNull()
    expect(await adapter.findByUserId('u-lea')).toEqual([])
  })

  it('deletes the Group when both Members leave concurrently', async () => {
    const prisma = await createTestDb()
    await seedUser(prisma, 'u-lea', 'Léa')
    await seedUser(prisma, 'u-bob', 'Bob')
    const adapter = prismaGroupAdapter(prisma)
    await adapter.save(potes)

    await Promise.all([adapter.leave('g1', 'u-lea'), adapter.leave('g1', 'u-bob')])

    expect(await adapter.findById('g1')).toBeNull()
    expect(await prisma.member.count({ where: { groupId: 'g1' } })).toBe(0)
  })
})
