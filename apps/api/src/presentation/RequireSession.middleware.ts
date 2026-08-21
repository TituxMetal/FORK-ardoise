import { createMiddleware } from 'hono/factory'
import type { IAuth } from '~/application/IAuth.port'
import { unauthorized } from '~/domain/unauthorized'

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
