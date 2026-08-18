import { groupReconstitute } from '../domain/Group.entity.ts'
import { groupNameReconstitute } from '../domain/GroupName.vo.ts'
import { memberReconstitute } from '../domain/Member.entity.ts'

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
