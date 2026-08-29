import type { SlateView } from '~/groups/application/getSlate.uc'
import { groupCreate } from '~/groups/domain/group.entity'
import { groupNameFrom } from '~/groups/domain/groupName.vo'
import type { GroupRepository } from '~/groups/domain/group.repository'
import { memberOf } from '~/groups/domain/member.entity'

export const createGroup = (groups: GroupRepository, view: SlateView) => ({
  execute: async (userId: string, userName: string, name: string) => {
    const group = groupCreate(groupNameFrom(name), memberOf(userId, userName))
    await groups.save(group)
    return view.execute(userId, group.id)
  }
})
