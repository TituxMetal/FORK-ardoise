import { describe, expect, it } from 'vite-plus/test'
import type { Group } from '~/groups/domain/group.entity'
import { groupReconstitute } from '~/groups/domain/group.entity'
import { groupNameReconstitute } from '~/groups/domain/groupName.vo'
import { memberOf } from '~/groups/domain/member.entity'
import type { GroupRepository } from '~/groups/domain/group.repository'
import { listGroups } from './listGroups.uc'

const potes = groupReconstitute(
  'g1',
  groupNameReconstitute('Potes de Bob'),
  [memberOf('u-lea', 'Léa')],
  'secret'
)
const coworkers = groupReconstitute(
  'g2',
  groupNameReconstitute('Collègues'),
  [memberOf('u-lea', 'Léa')],
  'secret'
)

const repository = (groups: Group[]): GroupRepository => ({
  save: async () => undefined,
  findById: async () => groups[0] ?? null,
  findByUserId: async () => groups,
  findByInviteSecret: async () => groups[0] ?? null,
  rename: async () => undefined,
  removeMember: async () => undefined,
  remove: async () => undefined
})

describe('listGroups', () => {
  it('lists the Groups of a User with their names', async () => {
    const groups = listGroups(repository([potes, coworkers]))

    const listed = await groups.execute('u-lea')

    expect(listed).toEqual([
      { id: 'g1', name: 'Potes de Bob' },
      { id: 'g2', name: 'Collègues' }
    ])
  })

  it('returns no Group for a User who sits in none', async () => {
    const groups = listGroups(repository([]))

    const listed = await groups.execute('u-lea')

    expect(listed).toEqual([])
  })
})
