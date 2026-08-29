import { describe, expect, it } from 'vite-plus/test'
import { toService } from './toService.mapper'

const row = {
  id: 's1',
  groupId: 'g1',
  label: 'Cours de guitare',
  day: '2026-08-15',
  amount: 100,
  providerId: 'u-lea',
  participants: [
    { userId: 'u-camille', ordinal: 2 },
    { userId: 'u-lea', ordinal: 0 },
    { userId: 'u-bob', ordinal: 1 }
  ],
  parts: [
    { userId: 'u-camille', amount: 33, ordinal: 2 },
    { userId: 'u-lea', amount: 34, ordinal: 0 },
    { userId: 'u-bob', amount: 33, ordinal: 1 }
  ]
}

describe('toService', () => {
  it('maps a row to a Service entity in ordinal order', () => {
    const service = toService(row)

    expect(service).toEqual({
      id: 's1',
      groupId: 'g1',
      label: { value: 'Cours de guitare' },
      day: { value: '2026-08-15' },
      amount: { value: 100 },
      providerId: 'u-lea',
      participantIds: ['u-lea', 'u-bob', 'u-camille'],
      parts: [
        { userId: 'u-lea', amount: { value: 34 } },
        { userId: 'u-bob', amount: { value: 33 } },
        { userId: 'u-camille', amount: { value: 33 } }
      ]
    })
  })

  it('maps a Service without Participants or Parts', () => {
    const service = toService({ ...row, participants: [], parts: [] })

    expect(service.participantIds).toEqual([])
    expect(service.parts).toEqual([])
  })
})
