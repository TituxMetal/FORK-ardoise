import { describe, expect, it } from 'vite-plus/test'
import { groupReconstitute, type Group } from '~/groups/domain/group.entity'
import { groupNameReconstitute } from '~/groups/domain/groupName.vo'
import type { GroupRepository } from '~/groups/domain/group.repository'
import { memberOf } from '~/groups/domain/member.entity'
import { leaveGroup } from './leaveGroup.uc'

const repository = (
  found: Group | null,
  calls: { removeMember?: [string, string]; remove?: [string] } = {}
): GroupRepository => ({
  save: async () => undefined,
  findById: async () => found,
  findByUserId: async () => (found ? [found] : []),
  findByInviteSecret: async () => found,
  rename: async () => undefined,
  removeMember: async (id, userId) => {
    calls.removeMember = [id, userId]
  },
  remove: async id => {
    calls.remove = [id]
  }
})

describe('leaveGroup', () => {
  it('removes the Member seat when other Members stay', async () => {
    const calls: { removeMember?: [string, string]; remove?: [string] } = {}
    const groups = leaveGroup(
      repository(
        groupReconstitute(
          'g1',
          groupNameReconstitute('Potes de Bob'),
          [memberOf('u1', 'Léa'), memberOf('u2', 'Bob')],
          'secret'
        ),
        calls
      )
    )

    await groups.execute('u1', 'g1')

    expect(calls.removeMember).toEqual(['g1', 'u1'])
    expect(calls.remove).toBeUndefined()
  })

  it('deletes the Group when the leaver is the last Member', async () => {
    const calls: { removeMember?: [string, string]; remove?: [string] } = {}
    const groups = leaveGroup(
      repository(
        groupReconstitute(
          'g1',
          groupNameReconstitute('Potes de Bob'),
          [memberOf('u1', 'Léa')],
          'secret'
        ),
        calls
      )
    )

    await groups.execute('u1', 'g1')

    expect(calls.remove).toEqual(['g1'])
    expect(calls.removeMember).toBeUndefined()
  })

  it('refuses a Group the User does not sit in as not found', async () => {
    const calls: { removeMember?: [string, string]; remove?: [string] } = {}
    const groups = leaveGroup(
      repository(
        groupReconstitute(
          'g1',
          groupNameReconstitute('Potes de Bob'),
          [memberOf('u1', 'Léa')],
          'secret'
        ),
        calls
      )
    )

    const leave = groups.execute('u2', 'g1')

    await expect(leave).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Groupe introuvable'
    })
    expect(calls).toEqual({})
  })

  it('refuses an unknown Group as not found', async () => {
    const calls: { removeMember?: [string, string]; remove?: [string] } = {}
    const groups = leaveGroup(repository(null, calls))

    const leave = groups.execute('u1', 'missing')

    await expect(leave).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Groupe introuvable'
    })
    expect(calls).toEqual({})
  })
})
