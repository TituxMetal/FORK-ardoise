import { describe, expect, it } from 'vite-plus/test'
import { invalidData } from './invalidData.vo'

describe('invalidData', () => {
  it('builds a 400 INVALID_DATA error with the message', () => {
    const error = invalidData('Montant requis')

    expect(error.code).toBe('INVALID_DATA')
    expect(error.statusCode).toBe(400)
    expect(error.message).toBe('Montant requis')
  })
})
