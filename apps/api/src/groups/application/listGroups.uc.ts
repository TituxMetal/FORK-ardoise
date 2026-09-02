import type { GroupRepository } from '../domain'

export const listGroups = (groups: GroupRepository) => ({
  execute: async (userId: string) => {
    const listed = await groups.findByUserId(userId)
    return listed.map(group => ({
      id: group.id,
      name: group.name.value
    }))
  }
})
