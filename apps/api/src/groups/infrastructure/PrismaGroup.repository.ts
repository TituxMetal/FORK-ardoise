import type { PrismaClient } from '@prisma/client'
import type { Group } from '../domain/Group.entity.ts'
import type { IGroupRepository } from '../domain/IGroup.repository.ts'
import { toGroup } from './ToGroup.mapper.ts'

const include = { members: true } as const

export const prismaGroupRepository = (prisma: PrismaClient): IGroupRepository => ({
  async save(group: Group) {
    const existing = await prisma.group.findUnique({
      where: { id: group.id },
      include
    })
    if (!existing) {
      await prisma.group.create({
        data: {
          id: group.id,
          name: group.name.value,
          inviteSecret: group.inviteSecret,
          members: {
            create: group.members.map(member => ({
              id: crypto.randomUUID(),
              userId: member.userId,
              name: member.name
            }))
          }
        }
      })
      return
    }
    const known = new Set(existing.members.map(member => member.userId))
    const added = group.members.filter(member => !known.has(member.userId))
    if (added.length === 0) {
      return
    }
    await prisma.member.createMany({
      data: added.map(member => ({
        id: crypto.randomUUID(),
        userId: member.userId,
        groupId: group.id,
        name: member.name
      }))
    })
  },

  async findByInviteSecret(secret: string) {
    const row = await prisma.group.findUnique({
      where: { inviteSecret: secret },
      include
    })
    return row ? toGroup(row) : null
  },

  async findById(id: string) {
    const row = await prisma.group.findUnique({
      where: { id },
      include
    })
    return row ? toGroup(row) : null
  },

  async findByUserId(userId: string) {
    const rows = await prisma.group.findMany({
      where: { members: { some: { userId } } },
      include
    })
    return rows.map(toGroup)
  }
})
