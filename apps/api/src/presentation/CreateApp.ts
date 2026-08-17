import type { PrismaClient } from '@prisma/client'
import { Hono } from 'hono'
import type { IAuth } from '../application/IAuth.port.ts'
import { PrismaExpenseRepository } from '../depenses/infrastructure/PrismaExpense.repository.ts'
import { createDepensesRoutes } from '../depenses/presentation/Depenses.routes.ts'
import { PrismaGroupRepository } from '../groupes/infrastructure/PrismaGroup.repository.ts'
import { createGroupesRoutes } from '../groupes/presentation/Groupes.routes.ts'
import { createInvitationsRoutes } from '../groupes/presentation/Invitations.routes.ts'
import { PrismaServiceRepository } from '../services/infrastructure/PrismaService.repository.ts'
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
  const depenses = new PrismaExpenseRepository(prisma)
  const services = new PrismaServiceRepository(prisma)
  const paybacks = new PrismaPaybackRepository(prisma)
  app.onError(mapException)
  app.get('/ping', c => c.body(null, 200))
  app.on(['POST', 'GET'], '/auth/*', c => auth.handler(c.req.raw))
  app.use('/groups/*', requireSession(auth))
  app.use('/groups', requireSession(auth))
  app.use('/invitations/*', requireSession(auth))
  app.route('/groups', createGroupesRoutes(groupes, depenses, services, paybacks))
  app.route('/groups', createDepensesRoutes(groupes, depenses, services, paybacks))
  app.route('/groups', createServicesRoutes(groupes, depenses, services, paybacks))
  app.route('/groups', createPaybacksRoutes(groupes, depenses, services, paybacks))
  app.route('/invitations', createInvitationsRoutes(groupes))
  return app
}
