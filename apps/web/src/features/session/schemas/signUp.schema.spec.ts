import { describe, expect, it } from 'vite-plus/test'
import { signUpSchema } from './signUp.schema'

describe('signUpSchema', () => {
  it('accepts a valid sign-up input', () => {
    const input = { name: 'Léa', email: 'lea@example.com', password: 'password1234' }

    expect(signUpSchema.parse(input)).toEqual(input)
  })

  it('trims the name and the email', () => {
    expect(
      signUpSchema.parse({
        name: '  Léa  ',
        email: '  lea@example.com  ',
        password: 'password1234'
      })
    ).toEqual({ name: 'Léa', email: 'lea@example.com', password: 'password1234' })
  })

  it('rejects a blank name with a French message', () => {
    const result = signUpSchema.safeParse({
      name: '   ',
      email: 'lea@example.com',
      password: 'password1234'
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Nom requis')
  })

  it('rejects a malformed email with a French message', () => {
    const result = signUpSchema.safeParse({
      name: 'Léa',
      email: 'lea',
      password: 'password1234'
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('E-mail invalide')
  })

  it('rejects a password shorter than eight characters with a French message', () => {
    const result = signUpSchema.safeParse({
      name: 'Léa',
      email: 'lea@example.com',
      password: 'short'
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Mot de passe : 8 caractères minimum')
  })
})
