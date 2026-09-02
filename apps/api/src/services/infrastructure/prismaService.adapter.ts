import type { PrismaClient } from '@prisma/client'
import type { Service, ServiceRepository } from '../domain'
import { toService } from './toService.mapper'

const include = { participants: true, parts: true } as const

export const prismaServiceAdapter = (prisma: PrismaClient): ServiceRepository => ({
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

  async update(service: Service) {
    // The split is derived from the fields, so an edit replaces the stored
    // Participants and Parts atomically with the re-derived ones.
    await prisma.$transaction([
      prisma.servicePart.deleteMany({ where: { serviceId: service.id } }),
      prisma.serviceParticipant.deleteMany({ where: { serviceId: service.id } }),
      prisma.service.update({
        where: { id: service.id },
        data: {
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
    ])
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
