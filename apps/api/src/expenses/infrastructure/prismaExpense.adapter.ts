import type { PrismaClient } from '@prisma/client'
import type { Expense } from '~/expenses/domain/expense.entity'
import type { ExpenseRepository } from '~/expenses/domain/expense.repository'
import { toExpense } from '~/expenses/infrastructure/toExpense.mapper'

const include = { participants: true, parts: true } as const

export const prismaExpenseAdapter = (prisma: PrismaClient): ExpenseRepository => ({
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

  async update(expense: Expense) {
    // The split is derived from the fields, so an edit replaces the stored
    // Participants and Parts atomically with the re-derived ones.
    await prisma.$transaction([
      prisma.expensePart.deleteMany({ where: { expenseId: expense.id } }),
      prisma.expenseParticipant.deleteMany({ where: { expenseId: expense.id } }),
      prisma.expense.update({
        where: { id: expense.id },
        data: {
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
    ])
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
