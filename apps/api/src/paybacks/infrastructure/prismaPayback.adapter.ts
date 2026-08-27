import type { PrismaClient } from '@prisma/client'
import type { Payback } from '~/paybacks/domain/payback.entity'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'
import { toPayback } from '~/paybacks/infrastructure/toPayback.mapper'

export const prismaPaybackAdapter = (prisma: PrismaClient): PaybackRepository => ({
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
