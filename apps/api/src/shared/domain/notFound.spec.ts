import { describe, expect, it } from 'vite-plus/test'
import { notFound } from './notFound.vo'

describe('notFound', () => {
  it('builds a 404 NOT_FOUND error with the default message', () => {
    const error = notFound()

    expect(error.code).toBe('NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error.message).toBe('Introuvable')
  })

  it('uses a custom message when given one', () => {
    const error = notFound('Groupe introuvable')

    expect(error.message).toBe('Groupe introuvable')
  })
})
