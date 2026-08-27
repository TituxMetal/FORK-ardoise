import type { PrismaClient } from '@prisma/client'
import { Hono } from 'hono'
import type { Auth } from '~/shared/application'
import { prismaExpenseRepository } from '~/expenses/infrastructure/PrismaExpense.repository'
import { createExpensesRoutes } from '~/expenses/presentation/Expenses.routes'
import { prismaGroupAdapter } from '~/groups/infrastructure/prismaGroup.adapter'
import { createGroupsRoutes } from '~/groups/presentation/groups.routes'
import { createInvitesRoutes } from '~/groups/presentation/invites.routes'
import { prismaServiceRepository } from '~/services/infrastructure/PrismaService.repository'
import { createServicesRoutes } from '~/services/presentation/Services.routes'
import { prismaPaybackRepository } from '~/paybacks/infrastructure/PrismaPayback.repository'
import { createPaybacksRoutes } from '~/paybacks/presentation/Paybacks.routes'
import { createAuth, createPrismaClient } from '~/shared/infrastructure'

import { mapException, requireSession } from '~/shared/presentation'

export const createApp = (
  prisma: PrismaClient = createPrismaClient(),
  auth: Auth = createAuth(prisma)
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const groups = prismaGroupAdapter(prisma)
  const expenses = prismaExpenseRepository(prisma)
  const services = prismaServiceRepository(prisma)
  const paybacks = prismaPaybackRepository(prisma)
  app.onError(mapException)
  app.get('/ping', c => c.body(null, 200))
  app.on(['POST', 'GET'], '/auth/*', c => auth.handler(c.req.raw))
  app.use('/groups/*', requireSession(auth))
  app.use('/groups', requireSession(auth))
  app.use('/invites/*', requireSession(auth))
  app.route('/groups', createGroupsRoutes(groups, expenses, services, paybacks))
  app.route('/groups', createExpensesRoutes(groups, expenses, services, paybacks))
  app.route('/groups', createServicesRoutes(groups, expenses, services, paybacks))
  app.route('/groups', createPaybacksRoutes(groups, expenses, services, paybacks))
  app.route('/invites', createInvitesRoutes(groups))
  return app
}
export type AppType = ReturnType<typeof createApp>
