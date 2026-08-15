import { createMiddleware } from 'hono/factory'
import type { IAuth } from '../application/IAuth.port.ts'
import { Unauthorized } from '../domain/Unauthorized.error.ts'

export const requireSession = (auth: IAuth) =>
  createMiddleware(async (c, next) => {
    const userId = await auth.getSessionUserId(c.req.raw.headers)
    if (!userId) {
      throw new Unauthorized()
    }
    c.set('userId', userId)
    await next()
  })
