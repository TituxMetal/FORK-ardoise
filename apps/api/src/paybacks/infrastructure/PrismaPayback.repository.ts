import type { PrismaClient } from '@prisma/client'
import type { Payback } from '~/paybacks/domain/Payback.entity'
import type { IPaybackRepository } from '~/paybacks/domain/IPayback.repository'
import { toPayback } from '~/paybacks/infrastructure/ToPayback.mapper'

export const prismaPaybackRepository = (prisma: PrismaClient): IPaybackRepository => ({
  async save(payback: Payback) {
    await prisma.payback.create({
      data: {
        id: payback.id,
        groupId: payback.groupId,
        debtorId: payback.debtorId,
        creditorId: payback.creditorId,
        amount: payback.amount.value
      }
    })
  },

  async findById(id: string) {
    const row = await prisma.payback.findUnique({ where: { id } })
    return row ? toPayback(row) : null
  },

  async findByGroupId(groupId: string) {
    const rows = await prisma.payback.findMany({
      where: { groupId }
    })
    return rows.map(toPayback)
  },

  async delete(id: string) {
    await prisma.payback.delete({ where: { id } })
  }
})
