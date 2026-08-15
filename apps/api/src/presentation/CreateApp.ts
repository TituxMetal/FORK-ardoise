import { Hono } from 'hono'

export const createApp = () => {
  const app = new Hono()
  app.get('/ping', c => c.body(null, 200))
  return app
}
