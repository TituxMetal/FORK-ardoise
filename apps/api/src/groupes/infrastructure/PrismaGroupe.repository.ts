import type { PrismaClient } from '@prisma/client'
import type { Groupe } from '../domain/Groupe.entity.ts'
import type { IGroupeRepository } from '../domain/IGroupe.repository.ts'
import { toGroupe } from './ToGroupe.mapper.ts'

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
    return row ? toGroupe(row) : null
  }

  async findByUserId(userId: string) {
    const rows = await this.prisma.groupe.findMany({
      where: { membres: { some: { userId } } },
      include: { membres: true }
    })
    return rows.map(toGroupe)
  }
}
