import { describe, expect, it } from 'vite-plus/test'
import { signInSchema } from './signIn.schema'

describe('signInSchema', () => {
  it('accepts a valid sign-in input', () => {
    const input = { email: 'lea@example.com', password: 'password1234' }

    expect(signInSchema.parse(input)).toEqual(input)
  })

  it('trims the email', () => {
    expect(signInSchema.parse({ email: '  lea@example.com  ', password: 'password1234' })).toEqual({
      email: 'lea@example.com',
      password: 'password1234'
    })
  })

  it('rejects a blank email with a French message', () => {
    const result = signInSchema.safeParse({ email: '   ', password: 'password1234' })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('E-mail requis')
  })

  it('rejects a malformed email with a French message', () => {
    const result = signInSchema.safeParse({ email: 'lea', password: 'password1234' })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('E-mail invalide')
  })

  it('rejects an empty password with a French message', () => {
    const result = signInSchema.safeParse({ email: 'lea@example.com', password: '' })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Mot de passe requis')
  })
})
