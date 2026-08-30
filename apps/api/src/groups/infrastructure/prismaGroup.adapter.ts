import type { PrismaClient } from '@prisma/client'
import type { Group } from '~/groups/domain/group.entity'
import type { GroupRepository } from '~/groups/domain/group.repository'
import { toGroup } from '~/groups/infrastructure/toGroup.mapper'

const include = { members: true } as const

export const prismaGroupAdapter = (prisma: PrismaClient): GroupRepository => ({
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
  },

  async rename(id: string, name: string) {
    await prisma.group.update({ where: { id }, data: { name } })
  },

  async leave(id: string, userId: string) {
    await prisma.$transaction([
      prisma.member.deleteMany({ where: { groupId: id, userId } }),
      prisma.group.deleteMany({ where: { id, members: { none: {} } } })
    ])
  }
})
