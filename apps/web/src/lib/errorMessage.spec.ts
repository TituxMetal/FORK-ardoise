import { describe, expect, it } from 'vite-plus/test'
import { errorMessage } from './errorMessage'

describe('errorMessage', () => {
  it('returns the message when the error is an Error', () => {
    expect(errorMessage(new Error('Dépense introuvable'), 'Impossible')).toBe('Dépense introuvable')
  })

  it('returns the fallback when the value is not an Error', () => {
    expect(errorMessage('unexpected', 'Impossible de créer le Groupe')).toBe(
      'Impossible de créer le Groupe'
    )
  })
})
