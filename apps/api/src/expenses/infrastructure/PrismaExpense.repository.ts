import type { PrismaClient } from '@prisma/client'
import type { Expense } from '~/expenses/domain/Expense.entity'
import type { IExpenseRepository } from '~/expenses/domain/IExpense.repository'
import { toExpense } from '~/expenses/infrastructure/ToExpense.mapper'

const include = { participants: true, parts: true } as const

export const prismaExpenseRepository = (prisma: PrismaClient): IExpenseRepository => ({
  async save(expense: Expense) {
    await prisma.expense.create({
      data: {
        id: expense.id,
        groupId: expense.groupId,
        label: expense.label.value,
        day: expense.day.value,
        amount: expense.amount.value,
        payerId: expense.payerId,
        participants: {
          create: expense.participantIds.map((userId, ordinal) => ({ userId, ordinal }))
        },
        parts: {
          create: expense.parts.map((part, ordinal) => ({
            userId: part.userId,
            amount: part.amount.value,
            ordinal
          }))
        }
      }
    })
  },

  async findById(id: string) {
    const row = await prisma.expense.findUnique({ where: { id }, include })
    return row ? toExpense(row) : null
  },

  async findByGroupId(groupId: string) {
    const rows = await prisma.expense.findMany({
      where: { groupId },
      include,
      orderBy: { day: 'asc' }
    })
    return rows.map(toExpense)
  },

  async delete(id: string) {
    await prisma.expense.delete({ where: { id } })
  }
})
