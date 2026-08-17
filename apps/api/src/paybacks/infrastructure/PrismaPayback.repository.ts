import type { PrismaClient } from '@prisma/client'
import type { Payback } from '../domain/Payback.entity.ts'
import type { IPaybackRepository } from '../domain/IPayback.repository.ts'
import { toPayback } from './ToPayback.mapper.ts'

export class PrismaPaybackRepository implements IPaybackRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(payback: Payback) {
    await this.prisma.payback.create({
      data: {
        id: payback.id,
        groupeId: payback.groupeId,
        debtorId: payback.debtorId,
        creditorId: payback.creditorId,
        amount: payback.amount.value
      }
    })
  }

  async findById(id: string) {
    const row = await this.prisma.payback.findUnique({ where: { id } })
    return row ? toPayback(row) : null
  }

  async findByGroupeId(groupeId: string) {
    const rows = await this.prisma.payback.findMany({
      where: { groupeId }
    })
    return rows.map(toPayback)
  }

  async delete(id: string) {
    await this.prisma.payback.delete({ where: { id } })
  }
}
