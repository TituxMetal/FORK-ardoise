import type { PrismaClient } from '@prisma/client'
import type { Depense } from '../domain/Depense.entity.ts'
import type { IExpenseRepository } from '../domain/IExpense.repository.ts'
import { toDepense } from './ToDepense.mapper.ts'

const include = { participants: true, parts: true } as const

export class PrismaExpenseRepository implements IExpenseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(depense: Depense) {
    await this.prisma.expense.create({
      data: {
        id: depense.id,
        groupeId: depense.groupeId,
        label: depense.label.value,
        day: depense.day.value,
        amount: depense.amount.value,
        payerId: depense.payerId,
        participants: {
          create: depense.participantIds.map((userId, ordinal) => ({ userId, ordinal }))
        },
        parts: {
          create: depense.parts.list.map((part, ordinal) => ({
            userId: part.userId,
            amount: part.amount.value,
            ordinal
          }))
        }
      }
    })
  }

  async findById(id: string) {
    const row = await this.prisma.expense.findUnique({ where: { id }, include })
    return row ? toDepense(row) : null
  }

  async findByGroupeId(groupeId: string) {
    const rows = await this.prisma.expense.findMany({
      where: { groupeId },
      include,
      orderBy: { day: 'asc' }
    })
    return rows.map(toDepense)
  }

  async delete(id: string) {
    await this.prisma.expense.delete({ where: { id } })
  }
}
