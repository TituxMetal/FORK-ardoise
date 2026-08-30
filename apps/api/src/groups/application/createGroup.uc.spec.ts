import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from '~/groups/application/group.dto'
import type { Group } from '~/groups/domain/group.entity'
import { GROUP_NAME_REQUIRED } from '~/groups/domain/groupName.vo'
import type { GroupRepository } from '~/groups/domain/group.repository'
import { memberOf } from '~/groups/domain/member.entity'
import { createGroup } from './createGroup.uc'

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

const repository = (saved: Group[] = []): GroupRepository => ({
  save: async group => {
    saved.push(group)
  },
  findById: async () => saved[0] ?? null,
  findByUserId: async () => saved,
  findByInviteSecret: async () => saved[0] ?? null,
  rename: async () => undefined,
  leave: async () => undefined
})

describe('createGroup', () => {
  it('saves the Group with the creator as first Member and returns the slate', async () => {
    const saved: Group[] = []
    const viewCalls: [string, string][] = []
    const groups = createGroup(repository(saved), {
      execute: async (userId, groupId) => {
        viewCalls.push([userId, groupId])
        return slate()
      }
    })

    const result = await groups.execute('u1', 'Léa', '  Potes de Bob  ')

    expect(saved).toHaveLength(1)
    expect(saved[0]?.name.value).toBe('Potes de Bob')
    expect(saved[0]?.members).toEqual([memberOf('u1', 'Léa')])
    expect(viewCalls).toEqual([['u1', saved[0]!.id]])
    expect(result).toEqual(slate())
  })

  it('refuses a blank name without saving', async () => {
    const saved: Group[] = []
    const groups = createGroup(repository(saved), { execute: async () => slate() })

    const create = groups.execute('u1', 'Léa', '   ')

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: GROUP_NAME_REQUIRED
    })
    expect(saved).toEqual([])
  })
})
