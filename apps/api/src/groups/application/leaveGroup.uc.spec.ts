import { describe, expect, it } from 'vite-plus/test'
import {
  groupReconstitute,
  type Group,
  groupNameReconstitute,
  type GroupRepository,
  memberOf
} from '../domain'
import { leaveGroup } from './leaveGroup.uc'

const repository = (
  found: Group | null,
  calls: { leave?: [string, string] } = {}
): GroupRepository => ({
  save: async () => undefined,
  findById: async () => found,
  findByUserId: async () => (found ? [found] : []),
  findByInviteSecret: async () => found,
  rename: async () => undefined,
  leave: async (id, userId) => {
    calls.leave = [id, userId]
  }
})

describe('leaveGroup', () => {
  it('removes the Member seat through the atomic leave', async () => {
    const calls: { leave?: [string, string] } = {}
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

    expect(calls.leave).toEqual(['g1', 'u1'])
  })

  it('refuses a Group the User does not sit in as not found', async () => {
    const calls: { leave?: [string, string] } = {}
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
    const calls: { leave?: [string, string] } = {}
    const groups = leaveGroup(repository(null, calls))

    const leave = groups.execute('u1', 'missing')

    await expect(leave).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Groupe introuvable'
    })
    expect(calls).toEqual({})
  })
})
