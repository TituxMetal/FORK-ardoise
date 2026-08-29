import { describe, expect, it } from 'vite-plus/test'
import { field } from './forms'

describe('field', () => {
  it('returns the string value of a form field', () => {
    const form = new FormData()
    form.set('email', 'lea@example.com')

    expect(field(form, 'email')).toBe('lea@example.com')
  })

  it('returns an empty string for a missing field', () => {
    const form = new FormData()

    expect(field(form, 'email')).toBe('')
  })

  it('returns an empty string for a non-string field', () => {
    const form = new FormData()
    form.set('file', new File(['content'], 'note.txt'))

    expect(field(form, 'file')).toBe('')
  })
})
