import { describe, expect, it } from 'vite-plus/test'
import { createGroupSchema } from './createGroup.schema'

describe('createGroupSchema', () => {
  it('accepts a non-empty name', () => {
    expect(createGroupSchema.parse({ name: 'Potes de Bob' })).toEqual({ name: 'Potes de Bob' })
  })

  it('trims surrounding whitespace', () => {
    expect(createGroupSchema.parse({ name: '  Potes de Bob  ' })).toEqual({ name: 'Potes de Bob' })
  })

  it('rejects a blank name with a French message', () => {
    const result = createGroupSchema.safeParse({ name: '   ' })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Nom du Groupe requis')
  })
})
