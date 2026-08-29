import { createClient } from '@libsql/client'
import { existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from 'api/createApp'
import { createPrismaClient } from 'api/shared/infrastructure'
import type { Auth, SessionUser } from 'api/shared/application'
import { createGroupsClient, type GroupsClient } from '~features/groups/client'

export const testUsers = {
  lea: { id: 'lea', name: 'Léa' },
  bob: { id: 'bob', name: 'Bob' },
  camille: { id: 'camille', name: 'Camille' }
} satisfies Record<string, SessionUser>

const stubAuth = (users: Record<string, SessionUser>): Auth => ({
  handler: () => Promise.resolve(new Response('stubbed auth', { status: 404 })),
  getSessionUser: async headers => {
    const userId = headers.get('x-test-user')
    return userId ? (users[userId] ?? null) : null
  }
})

// vitest runs from the repo root; import.meta.url is not a file URL under happy-dom
const migrationsDir = join(process.cwd(), 'apps/api/prisma/migrations')

const migrationsSql = readdirSync(migrationsDir)
  .filter(name => existsSync(join(migrationsDir, name, 'migration.sql')))
  .sort()
  .map(name => readFileSync(join(migrationsDir, name, 'migration.sql'), 'utf8'))
  .join('\n')

const seedUsers = async (prisma: ReturnType<typeof createPrismaClient>) => {
  for (const user of Object.values(testUsers)) {
    await prisma.user.create({
      data: { id: user.id, name: user.name, email: `${user.id}@example.com` }
    })
  }
}

export type TestApi = {
  app: ReturnType<typeof createApp>
  client: (user: SessionUser) => GroupsClient
}

export const createTestApi = async (): Promise<TestApi> => {
  const dir = mkdtempSync(join(tmpdir(), 'ardoise-web-'))
  const url = `file:${join(dir, 'test.db')}`
  const sqlite = createClient({ url })
  await sqlite.executeMultiple(migrationsSql)
  sqlite.close()

  const prisma = createPrismaClient(url)
  await seedUsers(prisma)

  const app = createApp(prisma, stubAuth(testUsers))
  return {
    app,
    client: user =>
      createGroupsClient({
        baseUrl: '',
        fetch: async (input, init) => {
          const headers = new Headers(init?.headers)
          headers.set('x-test-user', user.id)
          return await app.request(input, { ...init, headers })
        }
      })
  }
}
