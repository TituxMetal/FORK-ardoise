import { groupCreate } from '../domain/Group.entity.ts'
import { groupNameFrom } from '../domain/GroupName.vo.ts'
import type { IGroupRepository } from '../domain/IGroup.repository.ts'
import { memberOf } from '../domain/Member.entity.ts'
import { toGroupDto } from './ToGroup.mapper.ts'

export const createGroup = (groups: IGroupRepository) => ({
  execute: async (userId: string, userName: string, name: string) => {
    const group = groupCreate(groupNameFrom(name), memberOf(userId, userName))
    await groups.save(group)
    return toGroupDto(group)
  }
})
