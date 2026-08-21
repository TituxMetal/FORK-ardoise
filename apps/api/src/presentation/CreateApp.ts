import type { PrismaClient } from '@prisma/client'
import { Hono } from 'hono'
import type { IAuth } from '~/application/IAuth.port'
import { prismaExpenseRepository } from '~/expenses/infrastructure/PrismaExpense.repository'
import { createExpensesRoutes } from '~/expenses/presentation/Expenses.routes'
import { prismaGroupRepository } from '~/groups/infrastructure/PrismaGroup.repository'
import { createGroupsRoutes } from '~/groups/presentation/Groups.routes'
import { createInvitesRoutes } from '~/groups/presentation/Invites.routes'
import { prismaServiceRepository } from '~/services/infrastructure/PrismaService.repository'
import { createServicesRoutes } from '~/services/presentation/Services.routes'
import { prismaPaybackRepository } from '~/paybacks/infrastructure/PrismaPayback.repository'
import { createPaybacksRoutes } from '~/paybacks/presentation/Paybacks.routes'
import { createAuth } from '~/infrastructure/CreateAuth.adapter'
import { createPrismaClient } from '~/infrastructure/CreatePrisma.client'
import { mapException } from '~/presentation/MapException.filter'
import { requireSession } from '~/presentation/RequireSession.middleware'

export const createApp = (
  prisma: PrismaClient = createPrismaClient(),
  auth: IAuth = createAuth(prisma)
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const groups = prismaGroupRepository(prisma)
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
