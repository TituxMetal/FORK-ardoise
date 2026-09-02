import { describe, expect, it } from 'vite-plus/test'
import {
  groupReconstitute,
  type Group,
  groupNameReconstitute,
  type GroupRepository,
  memberOf
} from '../domain'
import { previewInvite } from './previewInvite.uc'

const repository = (found: Group | null): GroupRepository => ({
  save: async () => undefined,
  findById: async () => null,
  findByUserId: async () => [],
  findByInviteSecret: async () => found,
  rename: async () => undefined,
  leave: async () => undefined
})

describe('previewInvite', () => {
  it('returns the Group name and Member count for a known secret', async () => {
    const group = groupReconstitute(
      'g1',
      groupNameReconstitute('Potes de Bob'),
      [memberOf('u1', 'Léa'), memberOf('u2', 'Bob')],
      'secret'
    )
    const preview = previewInvite(repository(group))

    await expect(preview.execute('secret')).resolves.toEqual({
      name: 'Potes de Bob',
      memberCount: 2
    })
  })

  it('refuses an unknown Invite secret', async () => {
    const preview = previewInvite(repository(null))

    await expect(preview.execute('inconnu')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Invitation introuvable'
    })
  })
})
