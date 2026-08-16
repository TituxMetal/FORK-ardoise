import type { PrismaClient } from '@prisma/client'
import type { Groupe } from '../domain/Groupe.entity.ts'
import type { IGroupRepository } from '../domain/IGroup.repository.ts'
import { toGroupe } from './ToGroupe.mapper.ts'

export class PrismaGroupRepository implements IGroupRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(groupe: Groupe) {
    const existing = await this.prisma.group.findUnique({
      where: { id: groupe.id },
      include: { membres: true }
    })
    if (!existing) {
      await this.prisma.group.create({
        data: {
          id: groupe.id,
          name: groupe.name.value,
          invitationSecret: groupe.invitationSecret,
          membres: {
            create: groupe.membres.map(membre => ({
              id: crypto.randomUUID(),
              userId: membre.userId,
              name: membre.name
            }))
          }
        }
      })
      return
    }
    const known = new Set(existing.membres.map(membre => membre.userId))
    const added = groupe.membres.filter(membre => !known.has(membre.userId))
    if (added.length === 0) {
      return
    }
    await this.prisma.member.createMany({
      data: added.map(membre => ({
        id: crypto.randomUUID(),
        userId: membre.userId,
        groupeId: groupe.id,
        name: membre.name
      }))
    })
  }

  async findByInvitationSecret(secret: string) {
    const row = await this.prisma.group.findUnique({
      where: { invitationSecret: secret },
      include: { membres: true }
    })
    return row ? toGroupe(row) : null
  }

  async findById(id: string) {
    const row = await this.prisma.group.findUnique({
      where: { id },
      include: { membres: true }
    })
    return row ? toGroupe(row) : null
  }

  async findByUserId(userId: string) {
    const rows = await this.prisma.group.findMany({
      where: { membres: { some: { userId } } },
      include: { membres: true }
    })
    return rows.map(toGroupe)
  }
}
