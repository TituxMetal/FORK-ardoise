import { type GroupRepository, groupHasMember } from '../domain'
import { notFound } from '~/shared/domain'

export const leaveGroup = (groups: GroupRepository) => ({
  execute: async (userId: string, groupId: string) => {
    const group = await groups.findById(groupId)
    if (!group || !groupHasMember(group, userId)) {
      throw notFound('Groupe introuvable')
    }
    await groups.leave(groupId, userId)
  }
})
