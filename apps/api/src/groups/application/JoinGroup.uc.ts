import { notFound } from '../../domain/notFound.ts'
import { groupAddMember } from '../domain/Group.entity.ts'
import type { IGroupRepository } from '../domain/IGroup.repository.ts'
import { memberOf } from '../domain/Member.entity.ts'
import { toGroupDto } from './ToGroup.mapper.ts'

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
