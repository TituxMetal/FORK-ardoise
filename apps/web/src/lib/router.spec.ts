import { describe, expect, it } from 'vite-plus/test'
import { parsePath } from './router.tsx'

describe('parsePath', () => {
  it('parses the groups list route', () => {
    expect(parsePath('/')).toEqual({ name: 'groups' })
  })

  it('parses a group detail route', () => {
    expect(parsePath('/groups/g1')).toEqual({ name: 'group', id: 'g1' })
  })

  it('parses an invite route', () => {
    expect(parsePath('/invites/abc-123')).toEqual({ name: 'invite', secret: 'abc-123' })
  })

  it('parses the auth route', () => {
    expect(parsePath('/session')).toEqual({ name: 'auth' })
  })

  it('falls back to the groups list for unknown paths', () => {
    expect(parsePath('/unknown')).toEqual({ name: 'groups' })
  })
})
