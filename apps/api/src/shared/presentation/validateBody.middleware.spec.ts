import { Hono } from 'hono'
import { describe, expect, it } from 'vite-plus/test'
import { z } from 'zod'
import { mapException } from './mapException.filter'
import { validateBody } from './validateBody.middleware'

const buildApp = () => {
  const app = new Hono()
  app.onError(mapException)
  app.post('/things', validateBody(z.object({ name: z.string() })), c =>
    c.json({ name: c.req.valid('json').name }, 201)
  )
  return app
}

describe('validateBody', () => {
  it('rejects a body that does not match the schema shape with 400 Format invalide', async () => {
    const app = buildApp()

    const response = await app.request('/things', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 42 })
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      statusCode: 400,
      code: 'INVALID_DATA',
      message: 'Format invalide'
    })
  })

  it('lets a body that matches the schema reach the handler', async () => {
    const app = buildApp()

    const response = await app.request('/things', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Pizza' })
    })

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ name: 'Pizza' })
  })
})
