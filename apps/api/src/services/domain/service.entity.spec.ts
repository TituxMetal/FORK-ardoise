import { describe, expect, it } from 'vite-plus/test'
import { amountFromCents, PARTICIPANTS_REQUIRED } from '~/shared/domain'

import { dayReconstitute } from '~/expenses/domain/day.vo'
import { labelReconstitute } from '~/expenses/domain/label.vo'
import { serviceCreate, serviceReconstitute } from './service.entity'

const label = labelReconstitute('Cours de guitare')
const day = dayReconstitute('2026-08-15')

describe('Service', () => {
  it('splits the Amount equally and gives the remainder to the Provider', () => {
    const service = serviceCreate('g1', label, day, amountFromCents(100), 'u-lea', [
      'u-lea',
      'u-bob',
      'u-camille'
    ])

    expect(service.participantIds).toEqual(['u-lea', 'u-bob', 'u-camille'])
    expect(service.parts).toEqual([
      { userId: 'u-lea', amount: amountFromCents(34) },
      { userId: 'u-bob', amount: amountFromCents(33) },
      { userId: 'u-camille', amount: amountFromCents(33) }
    ])
  })

  it('adds a Part for a Provider outside Participants holding the remainder', () => {
    const service = serviceCreate('g1', label, day, amountFromCents(101), 'u-lea', [
      'u-bob',
      'u-camille'
    ])

    expect(service.parts).toEqual([
      { userId: 'u-bob', amount: amountFromCents(50) },
      { userId: 'u-camille', amount: amountFromCents(50) },
      { userId: 'u-lea', amount: amountFromCents(1) }
    ])
  })

  it('refuses zero Participants', () => {
    expect(() => serviceCreate('g1', label, day, amountFromCents(100), 'u-lea', [])).toThrow(
      PARTICIPANTS_REQUIRED
    )
  })

  it('reconstitutes a Service without validation', () => {
    const service = serviceReconstitute(
      's1',
      'g1',
      label,
      day,
      amountFromCents(100),
      'u-lea',
      ['u-bob'],
      [{ userId: 'u-bob', amount: amountFromCents(100) }]
    )

    expect(service).toEqual({
      id: 's1',
      groupId: 'g1',
      label,
      day,
      amount: amountFromCents(100),
      providerId: 'u-lea',
      participantIds: ['u-bob'],
      parts: [{ userId: 'u-bob', amount: amountFromCents(100) }]
    })
  })
})
