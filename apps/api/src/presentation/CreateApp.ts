import type { PrismaClient } from '@prisma/client'
import { Hono } from 'hono'
import type { IAuth } from '../application/IAuth.port.ts'
import { createGroupesRoutes } from '../groupes/presentation/Groupes.routes.ts'
import { createInvitationsRoutes } from '../groupes/presentation/Invitations.routes.ts'
import { PrismaGroupeRepository } from '../groupes/infrastructure/PrismaGroupe.repository.ts'
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
  app.onError(mapException)
  app.get('/ping', c => c.body(null, 200))
  app.on(['POST', 'GET'], '/auth/*', c => auth.handler(c.req.raw))
  app.use('/groups/*', requireSession(auth))
  app.use('/groups', requireSession(auth))
  app.use('/invitations/*', requireSession(auth))
  app.route('/groups', createGroupesRoutes(groupes))
  app.route('/invitations', createInvitationsRoutes(groupes))
  return app
}
