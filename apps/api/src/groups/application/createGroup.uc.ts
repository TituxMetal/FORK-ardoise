import { groupCreate } from '~/groups/domain/group.entity'
import { groupNameFrom } from '~/groups/domain/groupName.vo'
import type { GroupRepository } from '~/groups/domain/group.repository'
import { memberOf } from '~/groups/domain/member.entity'
import { toGroupDto } from '~/groups/application/toGroup.mapper'

export const createGroup = (groups: GroupRepository) => ({
  execute: async (userId: string, userName: string, name: string) => {
    const group = groupCreate(groupNameFrom(name), memberOf(userId, userName))
    await groups.save(group)
    return toGroupDto(group)
  }
})
