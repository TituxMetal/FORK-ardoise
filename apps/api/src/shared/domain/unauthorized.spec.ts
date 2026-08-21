import { describe, expect, it } from 'vite-plus/test'
import { unauthorized } from './unauthorized.vo'

describe('unauthorized', () => {
  it('builds a 401 UNAUTHORIZED error with the default message', () => {
    const error = unauthorized()

    expect(error.code).toBe('UNAUTHORIZED')
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Session requise')
  })

  it('uses a custom message when given one', () => {
    const error = unauthorized('Accès refusé')

    expect(error.message).toBe('Accès refusé')
  })
})
