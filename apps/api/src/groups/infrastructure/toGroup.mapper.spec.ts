import { describe, expect, it } from 'vite-plus/test'
import { toGroup } from './toGroup.mapper'

describe('toGroup', () => {
  it('maps a row to a Group entity with its Members', () => {
    const group = toGroup({
      id: 'g1',
      name: 'Potes de Bob',
      inviteSecret: 'secret-1',
      members: [
        { userId: 'u-lea', name: 'Léa' },
        { userId: 'u-bob', name: 'Bob' }
      ]
    })

    expect(group).toEqual({
      id: 'g1',
      name: { value: 'Potes de Bob' },
      inviteSecret: 'secret-1',
      members: [
        { userId: 'u-lea', name: 'Léa' },
        { userId: 'u-bob', name: 'Bob' }
      ]
    })
  })

  it('maps a Group without Members', () => {
    const group = toGroup({ id: 'g1', name: 'Potes de Bob', inviteSecret: 'secret-1', members: [] })

    expect(group.members).toEqual([])
  })
})
