import type { Group } from '~/groups/domain/group.entity'

export type GroupRepository = {
  save: (group: Group) => Promise<void>
  findById: (id: string) => Promise<Group | null>
  findByUserId: (userId: string) => Promise<Group[]>
  findByInviteSecret: (secret: string) => Promise<Group | null>
}
