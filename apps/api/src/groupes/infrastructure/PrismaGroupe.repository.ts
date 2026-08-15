import type { PrismaClient } from '@prisma/client'
import { Groupe } from '../domain/Groupe.entity.ts'
import { GroupeName } from '../domain/GroupeName.vo.ts'
import type { IGroupeRepository } from '../domain/IGroupe.repository.ts'
import { Membre } from '../domain/Membre.entity.ts'

const toDomain = (row: { id: string; name: string; membres: { userId: string; name: string }[] }) =>
  Groupe.reconstitute(
    row.id,
    GroupeName.reconstitute(row.name),
    row.membres.map(membre => Membre.reconstitute(membre.userId, membre.name))
  )

export class PrismaGroupeRepository implements IGroupeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(groupe: Groupe) {
    await this.prisma.groupe.create({
      data: {
        id: groupe.id,
        name: groupe.name.value,
        membres: {
          create: groupe.membres.map(membre => ({
            id: crypto.randomUUID(),
            userId: membre.userId,
            name: membre.name
          }))
        }
      }
    })
  }

  async findById(id: string) {
    const row = await this.prisma.groupe.findUnique({
      where: { id },
      include: { membres: true }
    })
    return row ? toDomain(row) : null
  }

  async findByUserId(userId: string) {
    const rows = await this.prisma.groupe.findMany({
      where: { membres: { some: { userId } } },
      include: { membres: true }
    })
    return rows.map(toDomain)
  }
}
