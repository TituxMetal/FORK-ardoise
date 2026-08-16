import type { PrismaClient } from '@prisma/client'
import type { Service } from '../domain/Service.entity.ts'
import type { IServiceRepository } from '../domain/IService.repository.ts'
import { toService } from './ToService.mapper.ts'

const include = { participants: true, parts: true } as const

export class PrismaServiceRepository implements IServiceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(service: Service) {
    await this.prisma.service.create({
      data: {
        id: service.id,
        groupeId: service.groupeId,
        label: service.label.value,
        day: service.day.value,
        amount: service.amount.value,
        providerId: service.providerId,
        participants: {
          create: service.participantIds.map((userId, ordinal) => ({ userId, ordinal }))
        },
        parts: {
          create: service.parts.map((part, ordinal) => ({
            userId: part.userId,
            amount: part.amount.value,
            ordinal
          }))
        }
      }
    })
  }

  async findById(id: string) {
    const row = await this.prisma.service.findUnique({ where: { id }, include })
    return row ? toService(row) : null
  }

  async findByGroupeId(groupeId: string) {
    const rows = await this.prisma.service.findMany({
      where: { groupeId },
      include,
      orderBy: { day: 'asc' }
    })
    return rows.map(toService)
  }

  async delete(id: string) {
    await this.prisma.service.delete({ where: { id } })
  }
}
