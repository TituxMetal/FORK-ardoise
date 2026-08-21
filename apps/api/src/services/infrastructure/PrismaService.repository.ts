import type { PrismaClient } from '@prisma/client'
import type { Service } from '~/services/domain/Service.entity'
import type { IServiceRepository } from '~/services/domain/IService.repository'
import { toService } from '~/services/infrastructure/ToService.mapper'

const include = { participants: true, parts: true } as const

export const prismaServiceRepository = (prisma: PrismaClient): IServiceRepository => ({
  async save(service: Service) {
    await prisma.service.create({
      data: {
        id: service.id,
        groupId: service.groupId,
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
  },

  async findById(id: string) {
    const row = await prisma.service.findUnique({ where: { id }, include })
    return row ? toService(row) : null
  },

  async findByGroupId(groupId: string) {
    const rows = await prisma.service.findMany({
      where: { groupId },
      include,
      orderBy: { day: 'asc' }
    })
    return rows.map(toService)
  },

  async delete(id: string) {
    await prisma.service.delete({ where: { id } })
  }
})
