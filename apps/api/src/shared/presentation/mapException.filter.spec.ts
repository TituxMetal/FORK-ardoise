import { Hono } from 'hono'
import { describe, expect, it } from 'vite-plus/test'
import { domainError } from '~/shared/domain'
import { mapException } from './mapException.filter'

const app = new Hono()
app.onError(mapException)
app.get('/domain', () => {
  throw domainError('INVALID_DATA', 'Montant requis', 400)
})
app.get('/internal', () => {
  throw new Error('boom')
})

describe('mapException', () => {
  it('maps a domain error to its JSON contract', async () => {
    const response = await app.request('/domain')

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      statusCode: 400,
      code: 'INVALID_DATA',
      message: 'Montant requis'
    })
  })

  it('maps an unknown error to a 500 INTERNAL response', async () => {
    const response = await app.request('/internal')

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      statusCode: 500,
      code: 'INTERNAL',
      message: 'Erreur interne'
    })
  })
})
