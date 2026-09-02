import { createMiddleware } from 'hono/factory'
import type { Auth } from '../application'
import { unauthorized } from '../domain'

export const requireSession = (auth: Auth) =>
  createMiddleware(async (c, next) => {
    const user = await auth.getSessionUser(c.req.raw.headers)
    if (!user) {
      throw unauthorized()
    }
    c.set('userId', user.id)
    c.set('userName', user.name)
    await next()
  })
