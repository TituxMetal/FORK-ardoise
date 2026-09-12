import type { PrismaClient } from '@prisma/client'
import type { UserRepository } from '../domain'

export const prismaUserAdapter = (prisma: PrismaClient): UserRepository => ({
  async rename(userId, name) {
    await prisma.$transaction(async tx => {
      await tx.user.update({ where: { id: userId }, data: { name } })
      await tx.member.updateMany({ where: { userId }, data: { name } })
    })
  },
  async count() {
    return prisma.user.count()
  },
  async hasEmail(email) {
    return (await prisma.user.count({ where: { email } })) > 0
  }
})
