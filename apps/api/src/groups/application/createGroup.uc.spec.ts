import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from './group.dto'
import { type Group, GROUP_NAME_REQUIRED, type GroupRepository, memberOf } from '../domain'
import { createGroup } from './createGroup.uc'

const slate = (): GroupDto => ({
  id: 'g1',
  name: 'Potes de Bob',
  selfMemberId: 'u1',
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
