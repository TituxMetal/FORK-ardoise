import { describe, expect, it } from 'vite-plus/test'
import { updateNameSchema } from './updateName.schema'

describe('updateNameSchema', () => {
  it('accepts a non-empty name', () => {
    expect(updateNameSchema.parse({ name: 'Léa' })).toEqual({ name: 'Léa' })
  })

  it('trims surrounding whitespace', () => {
    expect(updateNameSchema.parse({ name: '  Léa  ' })).toEqual({ name: 'Léa' })
  })

  it('rejects a blank name with a French message', () => {
    const result = updateNameSchema.safeParse({ name: '   ' })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Nom requis')
  })
})
