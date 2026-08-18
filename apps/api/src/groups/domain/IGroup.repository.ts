import type { Group } from './Group.entity.ts'

export const IGroupRepository = Symbol('IGroupRepository')

export type IGroupRepository = {
  save: (group: Group) => Promise<void>
  findById: (id: string) => Promise<Group | null>
  findByUserId: (userId: string) => Promise<Group[]>
  findByInviteSecret: (secret: string) => Promise<Group | null>
}
