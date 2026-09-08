import { describe, expect, it } from 'vite-plus/test'
import { resolvePage } from './resolvePage'

const lea = { name: 'Léa' }

describe('resolvePage', () => {
  it('resolves a signed-out visitor on the landing route to the landing', () => {
    expect(resolvePage({ name: 'landing' }, null)).toEqual({ name: 'landing' })
  })

  it('resolves a signed-in Member on the landing route to the Groups list', () => {
    expect(resolvePage({ name: 'landing' }, lea)).toEqual({ name: 'groups' })
  })

  it('resolves a signed-out visitor on a non-public route to the auth card', () => {
    expect(resolvePage({ name: 'group', id: 'g1' }, null)).toEqual({ name: 'auth' })
    expect(resolvePage({ name: 'profile' }, null)).toEqual({ name: 'auth' })
    expect(resolvePage({ name: 'groups' }, null)).toEqual({ name: 'auth' })
  })

  it('resolves the auth route signed out to the auth card and with a session to Groups', () => {
    expect(resolvePage({ name: 'auth' }, null)).toEqual({ name: 'auth' })
    expect(resolvePage({ name: 'auth' }, lea)).toEqual({ name: 'groups' })
  })

  it('resolves the About route to the About page signed out and signed in', () => {
    expect(resolvePage({ name: 'about' }, null)).toEqual({ name: 'about' })
    expect(resolvePage({ name: 'about' }, lea)).toEqual({ name: 'about' })
  })

  it('resolves a signed-in Member on a Group route to that Group screen', () => {
    expect(resolvePage({ name: 'group', id: 'g1' }, lea)).toEqual({ name: 'group', id: 'g1' })
  })

  it('resolves a signed-in Member on the Profile route to the Profile screen', () => {
    expect(resolvePage({ name: 'profile' }, lea)).toEqual({ name: 'profile' })
  })

  it('resolves a signed-in Member on an unknown route to the Groups list fallback', () => {
    expect(resolvePage({ name: 'groups' }, lea)).toEqual({ name: 'groups' })
  })

  it('keeps the Invite page open signed out and signed in', () => {
    expect(resolvePage({ name: 'invite', secret: 'abc-123' }, null)).toEqual({
      name: 'invite',
      secret: 'abc-123'
    })
    expect(resolvePage({ name: 'invite', secret: 'abc-123' }, lea)).toEqual({
      name: 'invite',
      secret: 'abc-123'
    })
  })
})
