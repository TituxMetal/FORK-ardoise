import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { amountFromCents, dayReconstitute } from '~/shared/domain'
import { labelReconstitute } from '~/expenses/domain'
import { serviceCreate, serviceUpdate } from '../domain'
import { createPrismaClient } from '~/shared/infrastructure'
import { prismaServiceAdapter } from './prismaService.adapter'

const sql = (migration: string): string => {
  const url = new URL(`../../../prisma/migrations/${migration}/migration.sql`, import.meta.url)
  return readFileSync(fileURLToPath(url), 'utf8')
}

const createTestDb = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ardoise-service-'))
  const url = `file:${join(dir, 'test.db')}`
  const sqlite = createClient({ url })
  await sqlite.executeMultiple(
    `${sql('20260815130000_session_user')}\n${sql('20260815190000_groupe_membre')}\n${sql('20260816042947_invitation_secret')}\n${sql('20260816052720_depense')}\n${sql('20260816061030_service')}\n${sql('20260816070637_reglement')}\n${sql('20260816153023_rename_to_glossary')}\n${sql('20260817000000_expense_columns')}\n${sql('20260818000000_invite_secret')}\n${sql('20260818010000_group_id')}`
  )
  sqlite.close()
  return createPrismaClient(url)
}

const guitar = serviceCreate(
  'g1',
  labelReconstitute('Cours de guitare'),
  dayReconstitute('2026-08-15'),
  amountFromCents(100),
  'u-lea',
  ['u-lea', 'u-bob']
)

describe('prismaServiceAdapter', () => {
  it('saves a Service and reads it back', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaServiceAdapter(prisma)

    await adapter.save(guitar)

    expect(await adapter.findById(guitar.id)).toEqual(guitar)
  })

  it('returns null for an unknown Service', async () => {
    const prisma = await createTestDb()
    const adapter = prismaServiceAdapter(prisma)

    const found = await adapter.findById('missing')

    expect(found).toBeNull()
  })

  it('lists the Services of a Group by day', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaServiceAdapter(prisma)
    const babysitting = serviceCreate(
      'g1',
      labelReconstitute('Baby-sitting'),
      dayReconstitute('2026-08-20'),
      amountFromCents(60),
      'u-bob',
      ['u-bob']
    )

    await adapter.save(babysitting)
    await adapter.save(guitar)

    expect(await adapter.findByGroupId('g1')).toEqual([guitar, babysitting])
  })

  it('lists no Service for a Group without one', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaServiceAdapter(prisma)

    const found = await adapter.findByGroupId('g1')

    expect(found).toEqual([])
  })

  it('deletes a Service', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaServiceAdapter(prisma)
    await adapter.save(guitar)

    await adapter.delete(guitar.id)

    expect(await adapter.findById(guitar.id)).toBeNull()
  })
  it('updates a Service and replaces its Participants and Parts', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaServiceAdapter(prisma)
    await adapter.save(guitar)
    const edited = serviceUpdate(
      guitar.id,
      'g1',
      labelReconstitute('Cours de batterie'),
      dayReconstitute('2026-08-16'),
      amountFromCents(200),
      'u-bob',
      ['u-bob']
    )

    await adapter.update(edited)

    expect(await adapter.findById(guitar.id)).toEqual(edited)
  })
})
