import type { IGroupRepository } from '../domain/IGroup.repository.ts'

export const listGroups = (groups: IGroupRepository) => ({
  execute: async (userId: string) => {
    const listed = await groups.findByUserId(userId)
    return listed.map(group => ({
      id: group.id,
      name: group.name.value
    }))
  }
})
