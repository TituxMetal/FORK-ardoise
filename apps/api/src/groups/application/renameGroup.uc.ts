import type { GroupRepository } from '~/groups/domain/group.repository'
import { groupHasMember } from '~/groups/domain/group.entity'
import { groupNameFrom } from '~/groups/domain/groupName.vo'
import { notFound } from '~/shared/domain'

export const renameGroup = (groups: GroupRepository) => ({
  execute: async (userId: string, groupId: string, name: string) => {
    const group = await groups.findById(groupId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    const groupName = groupNameFrom(name)
    await groups.rename(groupId, groupName.value)
    return { id: groupId, name: groupName.value }
  }
})
