import { notFound } from '~/domain/notFound'
import { groupAddMember } from '~/groups/domain/Group.entity'
import type { IGroupRepository } from '~/groups/domain/IGroup.repository'
import { memberOf } from '~/groups/domain/Member.entity'
import { toGroupDto } from '~/groups/application/ToGroup.mapper'

export const joinGroup = (groups: IGroupRepository) => ({
  execute: async (userId: string, userName: string, secret: string) => {
    const group = await groups.findByInviteSecret(secret)
    if (!group) {
      throw notFound('Invitation introuvable')
    }
    groupAddMember(group, memberOf(userId, userName))
    await groups.save(group)
    return toGroupDto(group)
  }
})
