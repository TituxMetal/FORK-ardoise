import { describe, expect, it } from 'vite-plus/test'
import { domainError } from './domainError.vo'

describe('domainError', () => {
  it('builds an Error carrying the code, name and statusCode', () => {
    const error = domainError('INVALID_DATA', 'Montant requis', 400)

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('INVALID_DATA')
    expect(error.code).toBe('INVALID_DATA')
    expect(error.statusCode).toBe(400)
    expect(error.message).toBe('Montant requis')
  })
})
