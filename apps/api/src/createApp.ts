import type { PrismaClient } from '@prisma/client'
import { Hono } from 'hono'
import type { Auth } from '~/shared/application'
import { prismaExpenseAdapter } from '~/expenses/infrastructure'
import { createExpensesRoutes } from '~/expenses/presentation'
import { prismaGroupAdapter } from '~/groups/infrastructure'
import {
  createGroupsRoutes,
  createInvitePreviewRoutes,
  createInvitesRoutes
} from '~/groups/presentation'
import { prismaServiceAdapter } from '~/services/infrastructure'
import { createServicesRoutes } from '~/services/presentation'
import { prismaPaybackAdapter } from '~/paybacks/infrastructure'
import { createPaybacksRoutes } from '~/paybacks/presentation'
import { prismaUserAdapter } from '~/users/infrastructure'
import { createUsersRoutes } from '~/users/presentation'
import { createAuth, createPrismaClient } from '~/shared/infrastructure'
import { mapException, requireSession } from '~/shared/presentation'
import { getSlate } from '~/groups/application'

/** The deps the HTTP app and the demo seed both compose. */
export const createApiDeps = (prisma: PrismaClient) => {
  const groups = prismaGroupAdapter(prisma)
  const expenses = prismaExpenseAdapter(prisma)
  const services = prismaServiceAdapter(prisma)
  const paybacks = prismaPaybackAdapter(prisma)
  const users = prismaUserAdapter(prisma)
  return {
    groups,
    expenses,
    services,
    paybacks,
    users,
    view: getSlate(groups, expenses, services, paybacks)
  }
}

export const createApp = (
  prisma: PrismaClient = createPrismaClient(),
  auth: Auth = createAuth(prisma)
) => {
  const { groups, expenses, services, paybacks, users, view } = createApiDeps(prisma)
  return new Hono<{ Variables: { userId: string; userName: string } }>()
    .onError(mapException)
    .get('/ping', c => c.body(null, 200))
    .on(['POST', 'GET'], '/auth/*', c => auth.handler(c.req.raw))
    .route('/invites', createInvitePreviewRoutes(groups))
    .use('/groups/*', requireSession(auth))
    .use('/groups', requireSession(auth))
    .use('/invites/*', requireSession(auth))
    .use('/users/*', requireSession(auth))
    .route('/groups', createGroupsRoutes(groups, view))
    .route('/groups', createExpensesRoutes(expenses, view))
    .route('/groups', createServicesRoutes(services, view))
    .route('/groups', createPaybacksRoutes(paybacks, view))
    .route('/invites', createInvitesRoutes(groups, view))
    .route('/users', createUsersRoutes(users))
}
export type AppType = ReturnType<typeof createApp>
