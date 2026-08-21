import { groupCreate } from '~/groups/domain/Group.entity'
import { groupNameFrom } from '~/groups/domain/GroupName.vo'
import type { IGroupRepository } from '~/groups/domain/IGroup.repository'
import { memberOf } from '~/groups/domain/Member.entity'
import { toGroupDto } from '~/groups/application/ToGroup.mapper'

export const createGroup = (groups: IGroupRepository) => ({
  execute: async (userId: string, userName: string, name: string) => {
    const group = groupCreate(groupNameFrom(name), memberOf(userId, userName))
    await groups.save(group)
    return toGroupDto(group)
  }
})
