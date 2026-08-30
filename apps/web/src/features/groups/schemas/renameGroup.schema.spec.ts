import { describe, expect, it } from 'vite-plus/test'
import { renameGroupSchema } from './renameGroup.schema'

describe('renameGroupSchema', () => {
  it('accepts a non-empty name', () => {
    expect(renameGroupSchema.parse({ name: 'Soirée de Bob' })).toEqual({ name: 'Soirée de Bob' })
  })

  it('trims surrounding whitespace', () => {
    expect(renameGroupSchema.parse({ name: '  Soirée de Bob  ' })).toEqual({
      name: 'Soirée de Bob'
    })
  })

  it('rejects a blank name with a French message', () => {
    const result = renameGroupSchema.safeParse({ name: '   ' })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Nom du Groupe requis')
  })
})
