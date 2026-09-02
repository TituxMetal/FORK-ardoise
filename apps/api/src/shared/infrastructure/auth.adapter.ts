import type { PrismaClient } from '@prisma/client'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import type { Auth } from '../application'

export const createAuth = (prisma: PrismaClient): Auth => {
  const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    basePath: '/auth',
    secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-at-least-32-characters-long!!',
    database: prismaAdapter(prisma, { provider: 'sqlite' }),
    emailAndPassword: {
      enabled: true
    },
    trustedOrigins: ['http://localhost:1337']
  })

  return {
    handler: request => auth.handler(request),
    getSessionUser: async headers => {
      const session = await auth.api.getSession({ headers })
      if (!session) {
        return null
      }
      return { id: session.user.id, name: session.user.name }
    }
  }
}
