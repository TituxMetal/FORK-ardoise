import { describe, expect, it } from 'vite-plus/test'
import { memberOf, memberReconstitute } from './member.entity'

describe('Member', () => {
  it('creates a Member for a User in a Group', () => {
    const member = memberOf('u-lea', 'Léa')

    expect(member).toEqual({ userId: 'u-lea', name: 'Léa' })
  })

  it('reconstitutes a Member without validation', () => {
    const member = memberReconstitute('u-lea', 'Léa')

    expect(member).toEqual({ userId: 'u-lea', name: 'Léa' })
  })
})
