import type { PrismaClient } from '@prisma/client'
import { Hono } from 'hono'
import type { IAuth } from '../application/IAuth.port.ts'
import { PrismaDepenseRepository } from '../depenses/infrastructure/PrismaDepense.repository.ts'
import { createDepensesRoutes } from '../depenses/presentation/Depenses.routes.ts'
import { PrismaGroupeRepository } from '../groupes/infrastructure/PrismaGroupe.repository.ts'
import { createGroupesRoutes } from '../groupes/presentation/Groupes.routes.ts'
import { createInvitationsRoutes } from '../groupes/presentation/Invitations.routes.ts'
import { PrismaServiceRepository } from '../services/infrastructure/PrismaService.repository.ts'
import { createServicesRoutes } from '../services/presentation/Services.routes.ts'
import { PrismaReglementRepository } from '../reglements/infrastructure/PrismaReglement.repository.ts'
import { createReglementsRoutes } from '../reglements/presentation/Reglements.routes.ts'
import { createAuth } from '../infrastructure/CreateAuth.adapter.ts'
import { createPrismaClient } from '../infrastructure/CreatePrisma.client.ts'
import { mapException } from './MapException.filter.ts'
import { requireSession } from './RequireSession.middleware.ts'

export const createApp = (
  prisma: PrismaClient = createPrismaClient(),
  auth: IAuth = createAuth(prisma)
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const groupes = new PrismaGroupeRepository(prisma)
  const depenses = new PrismaDepenseRepository(prisma)
  const services = new PrismaServiceRepository(prisma)
  const reglements = new PrismaReglementRepository(prisma)
  app.onError(mapException)
  app.get('/ping', c => c.body(null, 200))
  app.on(['POST', 'GET'], '/auth/*', c => auth.handler(c.req.raw))
  app.use('/groups/*', requireSession(auth))
  app.use('/groups', requireSession(auth))
  app.use('/invitations/*', requireSession(auth))
  app.route('/groups', createGroupesRoutes(groupes, depenses, services, reglements))
  app.route('/groups', createDepensesRoutes(groupes, depenses, services, reglements))
  app.route('/groups', createServicesRoutes(groupes, depenses, services, reglements))
  app.route('/groups', createReglementsRoutes(groupes, depenses, services, reglements))
  app.route('/invitations', createInvitationsRoutes(groupes))
  return app
}
