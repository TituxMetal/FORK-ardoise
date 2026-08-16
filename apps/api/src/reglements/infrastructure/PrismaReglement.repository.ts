import type { PrismaClient } from '@prisma/client'
import type { Reglement } from '../domain/Reglement.entity.ts'
import type { IReglementRepository } from '../domain/IReglement.repository.ts'
import { toReglement } from './ToReglement.mapper.ts'

export class PrismaReglementRepository implements IReglementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(reglement: Reglement) {
    await this.prisma.reglement.create({
      data: {
        id: reglement.id,
        groupeId: reglement.groupeId,
        debtorId: reglement.debtorId,
        creditorId: reglement.creditorId,
        amount: reglement.amount.value
      }
    })
  }

  async findById(id: string) {
    const row = await this.prisma.reglement.findUnique({ where: { id } })
    return row ? toReglement(row) : null
  }

  async findByGroupeId(groupeId: string) {
    const rows = await this.prisma.reglement.findMany({
      where: { groupeId }
    })
    return rows.map(toReglement)
  }

  async delete(id: string) {
    await this.prisma.reglement.delete({ where: { id } })
  }
}
