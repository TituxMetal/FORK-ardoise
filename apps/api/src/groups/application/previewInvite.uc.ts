import type { GroupRepository } from '../domain'
import { notFound } from '~/shared/domain'
import type { InvitePreviewDto } from './invitePreview.dto'

export const previewInvite = (groups: GroupRepository) => ({
  execute: async (secret: string): Promise<InvitePreviewDto> => {
    const group = await groups.findByInviteSecret(secret)
    if (!group) {
      throw notFound('Invitation introuvable')
    }
    return { name: group.name.value, memberCount: group.members.length }
  }
})
