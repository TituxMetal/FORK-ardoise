import { createClient } from '@libsql/client'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { amountFromCents } from '~/shared/domain'

import { dayReconstitute } from '~/expenses/domain/day.vo'
import { expenseCreate } from '~/expenses/domain/expense.entity'
import { labelReconstitute } from '~/expenses/domain/label.vo'
import { createPrismaClient } from '~/shared/infrastructure/prisma.client'
import { prismaExpenseAdapter } from './prismaExpense.adapter'

const sql = (migration: string): string => {
  const url = new URL(`../../../prisma/migrations/${migration}/migration.sql`, import.meta.url)
  return readFileSync(fileURLToPath(url), 'utf8')
}

const createTestDb = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ardoise-expense-'))
  const url = `file:${join(dir, 'test.db')}`
  const sqlite = createClient({ url })
  await sqlite.executeMultiple(
    `${sql('20260815130000_session_user')}\n${sql('20260815190000_groupe_membre')}\n${sql('20260816042947_invitation_secret')}\n${sql('20260816052720_depense')}\n${sql('20260816061030_service')}\n${sql('20260816070637_reglement')}\n${sql('20260816153023_rename_to_glossary')}\n${sql('20260817000000_expense_columns')}\n${sql('20260818000000_invite_secret')}\n${sql('20260818010000_group_id')}`
  )
  sqlite.close()
  return createPrismaClient(url)
}

const pizza = expenseCreate(
  'g1',
  labelReconstitute('Pizza'),
  dayReconstitute('2026-08-15'),
  amountFromCents(100),
  'u-lea',
  ['u-lea', 'u-bob']
)

describe('prismaExpenseAdapter', () => {
  it('saves an Expense and reads it back', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaExpenseAdapter(prisma)

    await adapter.save(pizza)

    expect(await adapter.findById(pizza.id)).toEqual(pizza)
  })

  it('returns null for an unknown Expense', async () => {
    const prisma = await createTestDb()
    const adapter = prismaExpenseAdapter(prisma)

    const found = await adapter.findById('missing')

    expect(found).toBeNull()
  })

  it('lists the Expenses of a Group by day', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaExpenseAdapter(prisma)
    const later = expenseCreate(
      'g1',
      labelReconstitute('Cinéma'),
      dayReconstitute('2026-08-20'),
      amountFromCents(60),
      'u-bob',
      ['u-bob']
    )

    await adapter.save(later)
    await adapter.save(pizza)

    expect(await adapter.findByGroupId('g1')).toEqual([pizza, later])
  })

  it('lists no Expense for a Group without one', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaExpenseAdapter(prisma)

    const found = await adapter.findByGroupId('g1')

    expect(found).toEqual([])
  })

  it('deletes an Expense', async () => {
    const prisma = await createTestDb()
    await prisma.group.create({
      data: { id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1' }
    })
    const adapter = prismaExpenseAdapter(prisma)
    await adapter.save(pizza)

    await adapter.delete(pizza.id)

    expect(await adapter.findById(pizza.id)).toBeNull()
  })
})
