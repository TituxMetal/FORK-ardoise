import { Hono } from 'hono'
import { AllowWrite } from '../application/AllowWrite.uc.ts'
import type { IAuth } from '../application/IAuth.port.ts'
import { createAuth } from '../infrastructure/CreateAuth.adapter.ts'
import { createPrismaClient } from '../infrastructure/CreatePrisma.client.ts'
import { mapException } from './MapException.filter.ts'
import { requireSession } from './RequireSession.middleware.ts'

export const createApp = (auth: IAuth = createAuth(createPrismaClient())) => {
  const app = new Hono<{ Variables: { userId: string } }>()
  const allowWrite = new AllowWrite()
  app.onError(mapException)
  app.get('/ping', c => c.body(null, 200))
  app.on(['POST', 'GET'], '/auth/*', c => auth.handler(c.req.raw))
  app.post('/groups', requireSession(auth), c => {
    allowWrite.execute(c.get('userId'))
    return c.body(null, 201)
  })
  return app
}
