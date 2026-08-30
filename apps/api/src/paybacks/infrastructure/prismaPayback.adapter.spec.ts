import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { amountFromCents } from '~/shared/domain'

import { paybackReconstitute } from '~/paybacks/domain/payback.entity'
import { createPrismaClient } from '~/shared/infrastructure/prisma.client'
import { prismaPaybackAdapter } from './prismaPayback.adapter'

const sql = (migration: string): string => {
  const url = new URL(`../../../prisma/migrations/${migration}/migration.sql`, import.meta.url)
  return readFileSync(fileURLToPath(url), 'utf8')
}

const createTestDb = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ardoise-payback-'))
  const url = `file:${join(dir, 'test.db')}`
  const sqlite = createClient({ url })
  await sqlite.executeMultiple(
    `${sql('20260815130000_session_user')}\n${sql('20260815190000_groupe_membre')}\n${sql('20260816042947_invitation_secret')}\n${sql('20260816052720_depense')}\n${sql('20260816061030_service')}\n${sql('20260816070637_reglement')}\n${sql('20260816153023_rename_to_glossary')}\n${sql('20260817000000_expense_columns')}\n${sql('20260818000000_invite_secret')}\n${sql('20260818010000_group_id')}`
  )
  sqlite.close()
  return createPrismaClient(url)
}

const payback = paybackReconstitute('p1', 'g1', 'u-bob', 'u-lea', amountFromCents(500))

describe('prismaPaybackAdapter', () => {
  it('saves a Payback and reads it back', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaPaybackAdapter(prisma)

    await adapter.save(payback)

    expect(await adapter.findById('p1')).toEqual(payback)
  })

  it('returns null for an unknown Payback', async () => {
    const prisma = await createTestDb()
    const adapter = prismaPaybackAdapter(prisma)

    const found = await adapter.findById('missing')

    expect(found).toBeNull()
  })

  it('lists the Paybacks of a Group', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaPaybackAdapter(prisma)
    const second = paybackReconstitute('p2', 'g1', 'u-camille', 'u-lea', amountFromCents(300))

    await adapter.save(payback)
    await adapter.save(second)

    expect(await adapter.findByGroupId('g1')).toEqual([payback, second])
  })

  it('lists no Payback for a Group without one', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaPaybackAdapter(prisma)

    const found = await adapter.findByGroupId('g1')

    expect(found).toEqual([])
  })

  it('deletes a Payback', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaPaybackAdapter(prisma)
    await adapter.save(payback)

    await adapter.delete('p1')

    expect(await adapter.findById('p1')).toBeNull()
  })
  it('updates a Payback', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaPaybackAdapter(prisma)
    await adapter.save(payback)
    const edited = paybackReconstitute('p1', 'g1', 'u-lea', 'u-bob', amountFromCents(400))

    await adapter.update(edited)

    expect(await adapter.findById('p1')).toEqual(edited)
  })
})
