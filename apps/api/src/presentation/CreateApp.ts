import type { PrismaClient } from '@prisma/client'
import { Hono } from 'hono'
import type { IAuth } from '../application/IAuth.port.ts'
import { prismaExpenseRepository } from '../expenses/infrastructure/PrismaExpense.repository.ts'
import { createExpensesRoutes } from '../expenses/presentation/Expenses.routes.ts'
import { prismaGroupRepository } from '../groups/infrastructure/PrismaGroup.repository.ts'
import { createGroupsRoutes } from '../groups/presentation/Groups.routes.ts'
import { createInvitesRoutes } from '../groups/presentation/Invites.routes.ts'
import { prismaServiceRepository } from '../services/infrastructure/PrismaService.repository.ts'
import { createServicesRoutes } from '../services/presentation/Services.routes.ts'
import { PrismaPaybackRepository } from '../paybacks/infrastructure/PrismaPayback.repository.ts'
import { createPaybacksRoutes } from '../paybacks/presentation/Paybacks.routes.ts'
import { createAuth } from '../infrastructure/CreateAuth.adapter.ts'
import { createPrismaClient } from '../infrastructure/CreatePrisma.client.ts'
import { mapException } from './MapException.filter.ts'
import { requireSession } from './RequireSession.middleware.ts'

export const createApp = (
  prisma: PrismaClient = createPrismaClient(),
  auth: IAuth = createAuth(prisma)
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const groups = prismaGroupRepository(prisma)
  const expenses = prismaExpenseRepository(prisma)
  const services = prismaServiceRepository(prisma)
  const paybacks = new PrismaPaybackRepository(prisma)
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
