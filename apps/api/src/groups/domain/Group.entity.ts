import type { GroupName } from '~/groups/domain/GroupName.vo'
import type { Member } from '~/groups/domain/Member.entity'

export type Group = {
  id: string
  name: GroupName
  members: Member[]
  inviteSecret: string
}

export const groupCreate = (name: GroupName, creator: Member): Group => ({
  id: crypto.randomUUID(),
  name,
  members: [creator],
  inviteSecret: crypto.randomUUID()
})

export const groupReconstitute = (
  id: string,
  name: GroupName,
  members: Member[],
  inviteSecret: string
): Group => ({ id, name, members, inviteSecret })

export const groupHasMember = (group: Group, userId: string) =>
  group.members.some(member => member.userId === userId)

export const groupAddMember = (group: Group, member: Member) => {
  if (groupHasMember(group, member.userId)) {
    return
  }
  group.members.push(member)
}
