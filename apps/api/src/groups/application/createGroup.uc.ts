import type { SlateView } from './getSlate.uc'
import { groupCreate, groupNameFrom, type GroupRepository, memberOf } from '../domain'

export const createGroup = (groups: GroupRepository, view: SlateView) => ({
  execute: async (userId: string, userName: string, name: string) => {
    const group = groupCreate(groupNameFrom(name), memberOf(userId, userName))
    await groups.save(group)
    return view.execute(userId, group.id)
  }
})
