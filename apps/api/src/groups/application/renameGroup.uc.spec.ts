import { describe, expect, it } from 'vite-plus/test'
import {
  groupReconstitute,
  type Group,
  GROUP_NAME_REQUIRED,
  groupNameReconstitute,
  type GroupRepository,
  memberOf
} from '../domain'
import { renameGroup } from './renameGroup.uc'

const friendGroup = groupReconstitute(
  'g1',
  groupNameReconstitute('Potes de Bob'),
  [memberOf('u1', 'Léa'), memberOf('u2', 'Bob')],
  'secret'
)

const repository = (found: Group | null, renamed: string[] = []): GroupRepository => ({
  save: async () => undefined,
  findById: async () => found,
  findByUserId: async () => (found ? [found] : []),
  findByInviteSecret: async () => found,
  rename: async (id, name) => {
    renamed.push(`${id}:${name}`)
  },
  leave: async () => undefined
})

describe('renameGroup', () => {
  it('renames a Group the User sits in and returns the summary', async () => {
    const renamed: string[] = []
    const groups = renameGroup(repository(friendGroup, renamed))

    const result = await groups.execute('u1', 'g1', '  Soirée de Bob  ')

    expect(renamed).toEqual(['g1:Soirée de Bob'])
    expect(result).toEqual({ id: 'g1', name: 'Soirée de Bob' })
  })

  it('refuses a blank name with the domain rule without renaming', async () => {
    const renamed: string[] = []
    const groups = renameGroup(repository(friendGroup, renamed))

    const rename = groups.execute('u1', 'g1', '   ')

    await expect(rename).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: GROUP_NAME_REQUIRED
    })
    expect(renamed).toEqual([])
  })

  it('refuses a Group the User does not sit in as not found', async () => {
    const renamed: string[] = []
    const groups = renameGroup(repository(friendGroup, renamed))

    const rename = groups.execute('u3', 'g1', 'Soirée')

    await expect(rename).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Groupe introuvable'
    })
    expect(renamed).toEqual([])
  })

  it('refuses an unknown Group as not found', async () => {
    const renamed: string[] = []
    const groups = renameGroup(repository(null, renamed))

    const rename = groups.execute('u1', 'missing', 'Soirée')

    await expect(rename).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Groupe introuvable'
    })
    expect(renamed).toEqual([])
  })
})
