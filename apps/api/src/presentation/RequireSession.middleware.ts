import { createMiddleware } from 'hono/factory'
import type { IAuth } from '../application/IAuth.port.ts'
import { unauthorized } from '../domain/unauthorized.ts'

export const requireSession = (auth: IAuth) =>
  createMiddleware(async (c, next) => {
    const user = await auth.getSessionUser(c.req.raw.headers)
    if (!user) {
      throw unauthorized()
    }
    c.set('userId', user.id)
    c.set('userName', user.name)
    await next()
  })
