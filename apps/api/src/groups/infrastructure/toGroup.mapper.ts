import { groupReconstitute, groupNameReconstitute, memberReconstitute } from '../domain'

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
