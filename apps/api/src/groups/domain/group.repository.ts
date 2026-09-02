import type { Group } from './group.entity'

export type GroupRepository = {
  save: (group: Group) => Promise<void>
  findById: (id: string) => Promise<Group | null>
  findByUserId: (userId: string) => Promise<Group[]>
  findByInviteSecret: (secret: string) => Promise<Group | null>
  /** Renames the Group; the caller checked membership and the domain rule. */
  rename: (id: string, name: string) => Promise<void>
  /** Atomically removes the Member seat, deleting the Group when it empties. */
  leave: (id: string, userId: string) => Promise<void>
}
