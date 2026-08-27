import { groupReconstitute } from '~/groups/domain/group.entity'
import { groupNameReconstitute } from '~/groups/domain/groupName.vo'
import { memberReconstitute } from '~/groups/domain/member.entity'

export const toGroup = (row: {
  id: string
  name: string
  inviteSecret: string
  members: { userId: string; name: string }[]
}) =>
  groupReconstitute(
    row.id,
    groupNameReconstitute(row.name),
    row.members.map(member => memberReconstitute(member.userId, member.name)),
    row.inviteSecret
  )
