import { seedDemoData } from '~/shared/application'
import { createAuth, createPrismaClient } from '~/shared/infrastructure'
import { createApiDeps } from '~/createApp'

const prisma = createPrismaClient()
const outcome = await seedDemoData({
  ...createApiDeps(prisma),
  signUp: createAuth(prisma).signUp
})

if (outcome.seeded) {
  const { slate } = outcome
  console.log(
    `Demo dataset seeded: Group "${slate.name}" (${slate.members.length} Members); ` +
      `Expenses: ${slate.expenses.length}, Services: ${slate.services.length}, ` +
      `Paybacks: ${slate.paybacks.length}; invite /invites/${slate.invite.secret}`
  )
} else {
  console.log('Demo dataset skipped: the user table is not empty.')
}

await prisma.$disconnect()
