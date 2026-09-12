import { createClient } from '@libsql/client'
import { existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { createApiDeps } from '~/createApp'
import { createAuth, createPrismaClient } from '~/shared/infrastructure'
import { seedDemoData, type DemoSeedDeps } from './seedDemoData.uc'

// Every migration, in order: the seed drives the adapters the running database
// serves, so the schema has to match it whole rather than a subset.
const migrationsDir = fileURLToPath(new URL('../../../prisma/migrations', import.meta.url))
const migrationsSql = readdirSync(migrationsDir)
  .filter(name => existsSync(join(migrationsDir, name, 'migration.sql')))
  .sort()
  .map(name => readFileSync(join(migrationsDir, name, 'migration.sql'), 'utf8'))
  .join('\n')

const createTestSeed = async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ardoise-seed-'))
  const url = `file:${join(dir, 'test.db')}`
  const sqlite = createClient({ url })
  await sqlite.executeMultiple(migrationsSql)
  sqlite.close()

  const prisma = createPrismaClient(url)
  const deps: DemoSeedDeps = { ...createApiDeps(prisma), signUp: createAuth(prisma).signUp }
  return { prisma, deps }
}

describe('seedDemoData', () => {
  it('seeds the fixed demo accounts and slate into an empty database', async () => {
    const { prisma, deps } = await createTestSeed()

    const outcome = await seedDemoData(deps)

    expect(outcome.seeded).toBe(true)
    if (!outcome.seeded) {
      throw new Error('expected the seed to run')
    }
    const { slate } = outcome
    const leaId = slate.members.find(member => member.name === 'Léa')?.userId
    const bobId = slate.members.find(member => member.name === 'Bob')?.userId
    expect(slate.name).toBe('Démo Ardoise')
    expect(slate.invite.secret).toBe('ardoise-demo-invite')
    expect(slate.members).toHaveLength(2)
    expect(slate.expenses.map(expense => [expense.label, expense.amount])).toEqual([
      ['Courses', 3000],
      ['Essence', 2000]
    ])
    expect(
      slate.services.map(service => [service.label, service.amount, service.providerId])
    ).toEqual([['Bricolage', 2000, leaId]])
    expect(
      slate.paybacks.map(payback => [payback.debtorId, payback.creditorId, payback.amount])
    ).toEqual([[bobId, leaId, 500]])
    expect(
      Object.fromEntries(slate.balances.map(balance => [balance.name, balance.amount]))
    ).toEqual({
      Léa: 1000,
      Bob: -1000
    })
    const users = await prisma.user.findMany({ orderBy: { email: 'asc' } })
    expect(users.map(user => [user.email, user.name])).toEqual([
      ['bob@ardoise.test', 'Bob'],
      ['lea@ardoise.test', 'Léa']
    ])
  })

  it('seeds nothing a second time and leaves the seeded data alone', async () => {
    const { prisma, deps } = await createTestSeed()
    await seedDemoData(deps)

    const outcome = await seedDemoData(deps)

    expect(outcome).toEqual({ seeded: false })
    expect(await prisma.user.count()).toBe(2)
    expect(await prisma.group.count()).toBe(1)
    expect(await prisma.expense.count()).toBe(2)
    expect(await prisma.service.count()).toBe(1)
    expect(await prisma.payback.count()).toBe(1)
  })

  it('seeds nothing beside a real User', async () => {
    const { prisma, deps } = await createTestSeed()
    await prisma.user.create({
      data: { id: 'real', name: 'Camille', email: 'camille@example.com' }
    })

    const outcome = await seedDemoData(deps)

    expect(outcome).toEqual({ seeded: false })
    expect(await prisma.user.count()).toBe(1)
    expect(await prisma.group.count()).toBe(0)
  })

  it('refuses a half-seeded database instead of skipping it', async () => {
    const { prisma, deps } = await createTestSeed()
    await prisma.user.create({
      data: { id: 'half', name: 'Léa', email: 'lea@ardoise.test' }
    })

    await expect(seedDemoData(deps)).rejects.toThrow()

    expect(await prisma.group.count()).toBe(0)
  })
})
