import { describe, expect, it } from 'vite-plus/test'
import { amountFromCents } from './amount.vo'
import { PARTICIPANTS_REQUIRED, equalParts } from './part.vo'

describe('equalParts', () => {
  it('gives the Payer the remainder among the Participants', () => {
    const parts = equalParts(amountFromCents(100), ['lea', 'bob', 'camille'], 'lea')

    expect(parts.map(part => [part.userId, part.amount.value])).toEqual([
      ['lea', 34],
      ['bob', 33],
      ['camille', 33]
    ])
  })

  it('still gives the remainder to a Payer outside the Participants', () => {
    const parts = equalParts(amountFromCents(100), ['bob', 'camille', 'dan'], 'lea')

    expect(parts.map(part => [part.userId, part.amount.value])).toEqual([
      ['bob', 33],
      ['camille', 33],
      ['dan', 33],
      ['lea', 1]
    ])
  })

  it('gives the Payer the remainder and zero-cent Parts for a tiny split', () => {
    const parts = equalParts(amountFromCents(2), ['lea', 'bob', 'camille'], 'lea')

    expect(parts.map(part => [part.userId, part.amount.value])).toEqual([
      ['lea', 2],
      ['bob', 0],
      ['camille', 0]
    ])
  })

  it('refuses zero Participants', () => {
    const parts = () => equalParts(amountFromCents(100), [], 'lea')

    expect(parts).toThrow(PARTICIPANTS_REQUIRED)
  })
})
