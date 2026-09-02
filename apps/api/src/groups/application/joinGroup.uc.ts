import type { SlateView } from './getSlate.uc'
import { groupAddMember, type GroupRepository, memberOf } from '../domain'
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
