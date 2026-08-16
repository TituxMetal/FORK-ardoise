import type { Groupe } from './Groupe.entity.ts'

export const IGroupeRepository = Symbol('IGroupeRepository')

export type IGroupeRepository = {
  save: (groupe: Groupe) => Promise<void>
  findById: (id: string) => Promise<Groupe | null>
  findByUserId: (userId: string) => Promise<Groupe[]>
  findByInvitationSecret: (secret: string) => Promise<Groupe | null>
}
