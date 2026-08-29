import type { SlateView } from '~/groups/application/getSlate.uc'
import { groupAddMember } from '~/groups/domain/group.entity'
import type { GroupRepository } from '~/groups/domain/group.repository'
import { memberOf } from '~/groups/domain/member.entity'
import { notFound } from '~/shared/domain'

export const joinGroup = (groups: GroupRepository, view: SlateView) => ({
  execute: async (userId: string, userName: string, secret: string) => {
    const group = await groups.findByInviteSecret(secret)
    if (!group) {
      throw notFound('Invitation introuvable')
    }
    groupAddMember(group, memberOf(userId, userName))
    await groups.save(group)
    return view.execute(userId, group.id)
  }
})
