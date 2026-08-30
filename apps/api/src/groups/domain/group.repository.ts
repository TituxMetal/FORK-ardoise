import type { Group } from '~/groups/domain/group.entity'

export type GroupRepository = {
  save: (group: Group) => Promise<void>
  findById: (id: string) => Promise<Group | null>
  findByUserId: (userId: string) => Promise<Group[]>
  findByInviteSecret: (secret: string) => Promise<Group | null>
  /** Renames the Group; the caller checked membership and the domain rule. */
  rename: (id: string, name: string) => Promise<void>
  /** Removes one Member seat; the caller checked the Group is not emptied. */
  removeMember: (id: string, userId: string) => Promise<void>
  /** Deletes the whole Group with its Members, Expenses, Services and Paybacks. */
  remove: (id: string) => Promise<void>
}
