import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'

const apiRoot = () => fileURLToPath(new URL('../../..', import.meta.url))

export const createPrismaClient = (
  url = process.env.DATABASE_URL ?? `file:${resolve(apiRoot(), 'prisma/dev.db')}`
) => {
  const adapter = new PrismaLibSql({ url })
  return new PrismaClient({ adapter })
}
