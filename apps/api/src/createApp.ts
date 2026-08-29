import type { PrismaClient } from '@prisma/client'
import { Hono } from 'hono'
import type { Auth } from '~/shared/application'
import { prismaExpenseAdapter } from '~/expenses/infrastructure/prismaExpense.adapter'
import { createExpensesRoutes } from '~/expenses/presentation/expenses.routes'
import { prismaGroupAdapter } from '~/groups/infrastructure/prismaGroup.adapter'
import { createGroupsRoutes } from '~/groups/presentation/groups.routes'
import { createInvitesRoutes } from '~/groups/presentation/invites.routes'
import { prismaServiceAdapter } from '~/services/infrastructure/prismaService.adapter'
import { createServicesRoutes } from '~/services/presentation/services.routes'
import { prismaPaybackAdapter } from '~/paybacks/infrastructure/prismaPayback.adapter'
import { createPaybacksRoutes } from '~/paybacks/presentation/paybacks.routes'
import { createAuth, createPrismaClient } from '~/shared/infrastructure'
import { mapException, requireSession } from '~/shared/presentation'
import { getSlate } from '~/groups/application/getSlate.uc'

export const createApp = (
  prisma: PrismaClient = createPrismaClient(),
  auth: Auth = createAuth(prisma)
) => {
  const groups = prismaGroupAdapter(prisma)
  const expenses = prismaExpenseAdapter(prisma)
  const services = prismaServiceAdapter(prisma)
  const paybacks = prismaPaybackAdapter(prisma)
  const view = getSlate(groups, expenses, services, paybacks)
  return new Hono<{ Variables: { userId: string; userName: string } }>()
    .onError(mapException)
    .get('/ping', c => c.body(null, 200))
    .on(['POST', 'GET'], '/auth/*', c => auth.handler(c.req.raw))
    .use('/groups/*', requireSession(auth))
    .use('/groups', requireSession(auth))
    .use('/invites/*', requireSession(auth))
    .route('/groups', createGroupsRoutes(groups, view))
    .route('/groups', createExpensesRoutes(expenses, view))
    .route('/groups', createServicesRoutes(services, view))
    .route('/groups', createPaybacksRoutes(paybacks, view))
    .route('/invites', createInvitesRoutes(groups, view))
}
export type AppType = ReturnType<typeof createApp>
