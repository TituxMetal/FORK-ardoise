import { describe, expect, it } from 'vite-plus/test'
import { groupAddMember, groupCreate, groupHasMember, groupReconstitute } from './group.entity'
import { groupNameReconstitute } from './groupName.vo'
import { memberOf } from './member.entity'

const name = groupNameReconstitute('Potes de Bob')
const lea = memberOf('u-lea', 'Léa')
const bob = memberOf('u-bob', 'Bob')

describe('Group', () => {
  it('creates a Group with the creator as its first Member', () => {
    const group = groupCreate(name, lea)

    expect(group.id).toEqual(expect.any(String))
    expect(group.inviteSecret).toEqual(expect.any(String))
    expect(group.members).toEqual([lea])
  })

  it('tells whether a User sits in the Group', () => {
    const group = groupCreate(name, lea)

    expect(groupHasMember(group, 'u-lea')).toBe(true)
    expect(groupHasMember(group, 'u-bob')).toBe(false)
  })

  it('adds a new Member', () => {
    const group = groupCreate(name, lea)

    groupAddMember(group, bob)

    expect(group.members).toEqual([lea, bob])
  })

  it('keeps the Member list unchanged for an existing User', () => {
    const group = groupCreate(name, lea)

    groupAddMember(group, lea)

    expect(group.members).toEqual([lea])
  })

  it('reconstitutes a Group without validation', () => {
    const group = groupReconstitute('g1', name, [lea], 'secret-1')

    expect(group).toEqual({ id: 'g1', name, members: [lea], inviteSecret: 'secret-1' })
  })
})
