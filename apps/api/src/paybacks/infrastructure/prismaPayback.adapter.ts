import type { PrismaClient } from '@prisma/client'
import type { Payback, PaybackRepository } from '../domain'
import { toPayback } from './toPayback.mapper'

export const prismaPaybackAdapter = (prisma: PrismaClient): PaybackRepository => ({
  async save(payback: Payback) {
    await prisma.payback.create({
      data: {
        id: payback.id,
        groupId: payback.groupId,
        debtorId: payback.debtorId,
        creditorId: payback.creditorId,
        day: payback.day.value,
        amount: payback.amount.value
      }
    })
  },

  async findById(id: string) {
    const row = await prisma.payback.findUnique({ where: { id } })
    return row ? toPayback(row) : null
  },

  async update(payback: Payback) {
    await prisma.payback.update({
      where: { id: payback.id },
      data: {
        debtorId: payback.debtorId,
        creditorId: payback.creditorId,
        day: payback.day.value,
        amount: payback.amount.value
      }
    })
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
