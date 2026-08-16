import type { PrismaClient } from '@prisma/client'
import type { Reglement } from '../domain/Reglement.entity.ts'
import type { IPaybackRepository } from '../domain/IPayback.repository.ts'
import { toReglement } from './ToReglement.mapper.ts'

export class PrismaPaybackRepository implements IPaybackRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(reglement: Reglement) {
    await this.prisma.payback.create({
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
    const row = await this.prisma.payback.findUnique({ where: { id } })
    return row ? toReglement(row) : null
  }

  async findByGroupeId(groupeId: string) {
    const rows = await this.prisma.payback.findMany({
      where: { groupeId }
    })
    return rows.map(toReglement)
  }

  async delete(id: string) {
    await this.prisma.payback.delete({ where: { id } })
  }
}
