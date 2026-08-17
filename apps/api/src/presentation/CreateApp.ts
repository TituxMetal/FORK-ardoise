import type { PrismaClient } from '@prisma/client'
import { Hono } from 'hono'
import type { IAuth } from '../application/IAuth.port.ts'
import { prismaExpenseRepository } from '../expenses/infrastructure/PrismaExpense.repository.ts'
import { createExpensesRoutes } from '../expenses/presentation/Expenses.routes.ts'
import { PrismaGroupRepository } from '../groupes/infrastructure/PrismaGroup.repository.ts'
import { createGroupesRoutes } from '../groupes/presentation/Groupes.routes.ts'
import { createInvitationsRoutes } from '../groupes/presentation/Invitations.routes.ts'
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
  const groupes = new PrismaGroupRepository(prisma)
  const expenses = prismaExpenseRepository(prisma)
  const services = prismaServiceRepository(prisma)
  const paybacks = new PrismaPaybackRepository(prisma)
  app.onError(mapException)
  app.get('/ping', c => c.body(null, 200))
  app.on(['POST', 'GET'], '/auth/*', c => auth.handler(c.req.raw))
  app.use('/groups/*', requireSession(auth))
  app.use('/groups', requireSession(auth))
  app.use('/invitations/*', requireSession(auth))
  app.route('/groups', createGroupesRoutes(groupes, expenses, services, paybacks))
  app.route('/groups', createExpensesRoutes(groupes, expenses, services, paybacks))
  app.route('/groups', createServicesRoutes(groupes, expenses, services, paybacks))
  app.route('/groups', createPaybacksRoutes(groupes, expenses, services, paybacks))
  app.route('/invitations', createInvitationsRoutes(groupes))
  return app
}
