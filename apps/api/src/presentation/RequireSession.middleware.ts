import { createMiddleware } from 'hono/factory'
import type { IAuth } from '../application/IAuth.port.ts'
import { Unauthorized } from '../domain/Unauthorized.error.ts'

export const requireSession = (auth: IAuth) =>
  createMiddleware(async (c, next) => {
    const user = await auth.getSessionUser(c.req.raw.headers)
    if (!user) {
      throw new Unauthorized()
    }
    c.set('userId', user.id)
    c.set('userName', user.name)
    await next()
  })
