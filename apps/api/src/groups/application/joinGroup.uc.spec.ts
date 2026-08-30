import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from '~/groups/application/group.dto'
import { groupReconstitute, type Group } from '~/groups/domain/group.entity'
import { groupNameReconstitute } from '~/groups/domain/groupName.vo'
import type { GroupRepository } from '~/groups/domain/group.repository'
import { memberOf } from '~/groups/domain/member.entity'
import { joinGroup } from './joinGroup.uc'

const potes = () =>
  groupReconstitute('g1', groupNameReconstitute('Potes de Bob'), [memberOf('u1', 'Léa')], 'secret')

const slate = (): GroupDto => ({
  id: 'g1',
  name: 'Potes de Bob',
  members: [{ userId: 'u1', name: 'Léa' }],
  invite: { secret: 'secret' },
  expenses: [],
  services: [],
  paybacks: [],
  balances: [{ userId: 'u1', name: 'Léa', amount: 0 }]
})

const repository = (saved: Group[], found: Group | null): GroupRepository => ({
  save: async group => {
    saved.push(group)
  },
  findById: async () => found,
  findByUserId: async () => (found ? [found] : []),
  findByInviteSecret: async () => found,
  rename: async () => undefined,
  removeMember: async () => undefined,
  remove: async () => undefined
})

describe('joinGroup', () => {
  it('adds the User to the Group and returns the slate', async () => {
    const saved: Group[] = []
    const viewCalls: [string, string][] = []
    const joins = joinGroup(repository(saved, potes()), {
      execute: async (userId, groupId) => {
        viewCalls.push([userId, groupId])
        return slate()
      }
    })

    const result = await joins.execute('u2', 'Bob', 'secret')

    expect(saved[0]?.members).toEqual([memberOf('u1', 'Léa'), memberOf('u2', 'Bob')])
    expect(viewCalls).toEqual([['u2', 'g1']])
    expect(result).toEqual(slate())
  })

  it('leaves a single Member when the User already sits in the Group', async () => {
    const saved: Group[] = []
    const joins = joinGroup(repository(saved, potes()), { execute: async () => slate() })

    const result = await joins.execute('u1', 'Léa', 'secret')

    expect(saved[0]?.members).toEqual([memberOf('u1', 'Léa')])
    expect(result).toEqual(slate())
  })

  it('refuses an unknown Invite secret without saving', async () => {
    const saved: Group[] = []
    const joins = joinGroup(repository(saved, null), { execute: async () => slate() })

    const join = joins.execute('u2', 'Bob', 'inconnu')

    await expect(join).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Invitation introuvable'
    })
    expect(saved).toEqual([])
  })
})
