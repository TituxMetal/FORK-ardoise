import { describe, expect, it } from 'vite-plus/test'
import { createPrismaClient } from './prisma.client'

describe('createPrismaClient', () => {
  it('returns a client that queries the given database', async () => {
    const client = createPrismaClient('file::memory:?cache=shared')

    const rows = await client.$queryRaw<{ one: number }[]>`SELECT 1 AS one`

    expect(rows).toEqual([{ one: 1 }])
  })
})
