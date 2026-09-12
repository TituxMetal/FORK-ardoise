import { expenseMutation } from '~/expenses/application'
import type { ExpenseRepository } from '~/expenses/domain'
import { joinGroup, type GroupDto, type SlateView } from '~/groups/application'
import { groupCreate, groupNameFrom, memberOf, type GroupRepository } from '~/groups/domain'
import { paybackMutation } from '~/paybacks/application'
import type { PaybackRepository } from '~/paybacks/domain'
import { serviceMutation } from '~/services/application'
import type { ServiceRepository } from '~/services/domain'
import type { UserRepository } from '~/users/domain'
import type { AuthSignUp } from './auth.port'

export type DemoSeedDeps = {
  signUp: AuthSignUp['signUp']
  users: UserRepository
  groups: GroupRepository
  expenses: ExpenseRepository
  services: ServiceRepository
  paybacks: PaybackRepository
  view: SlateView
}

export type DemoSeedOutcome = { seeded: false } | { seeded: true; slate: GroupDto }

/**
 * The fixed demo dataset behind SEED_DEMO_DATA. Amounts are cents — the API's
 * unit — and the web formats them as euros; `docs/deployment.md` documents the
 * same values, so the runbook prints the exact Invite link and the reference
 * Balances the Payback leaves behind.
 */
const DEMO_PASSWORD = 'ardoise-demo'
const DEMO_DAY = '2026-01-01'
const DEMO_GROUP_NAME = 'Démo Ardoise'
const DEMO_INVITE_SECRET = 'ardoise-demo-invite'
const DEMO_ACCOUNTS = {
  lea: { email: 'lea@ardoise.test', name: 'Léa' },
  bob: { email: 'bob@ardoise.test', name: 'Bob' }
} as const
const DEMO_EXPENSES = [
  { label: 'Courses', amount: 3000, payer: 'lea', participants: ['lea', 'bob'] },
  { label: 'Essence', amount: 2000, payer: 'bob', participants: ['lea', 'bob'] }
] as const
const DEMO_SERVICE = {
  label: 'Bricolage',
  amount: 2000,
  provider: 'lea',
  participants: ['lea', 'bob']
} as const
const DEMO_PAYBACK = { debtor: 'bob', creditor: 'lea', amount: 500 } as const

type DemoMember = keyof typeof DEMO_ACCOUNTS

/**
 * Seeds the demo dataset through the application's own use cases over the Prisma
 * adapters, so Expense and Service parts and the Balances derive from the domain
 * rules instead of being hand-written. Inert beside real data: it seeds only an
 * empty user table, and the second call on a seeded database changes nothing.
 *
 * A run is not atomic, so a boot that dies partway leaves half a dataset behind.
 * The user table is then no longer empty, which would make every later boot skip
 * silently and serve a permanently half-seeded stack: an existing demo Group is
 * read as a finished run, and a demo account without that Group refuses to start
 * instead of reporting success.
 */
export const seedDemoData = async (deps: DemoSeedDeps): Promise<DemoSeedOutcome> => {
  if ((await deps.users.count()) > 0) {
    if (await deps.groups.findByInviteSecret(DEMO_INVITE_SECRET)) {
      return { seeded: false }
    }
    if (await deps.users.hasEmail(DEMO_ACCOUNTS.lea.email)) {
      throw new Error(
        'The demo dataset is half-seeded: lea@ardoise.test exists without the ' +
          'Démo Ardoise Group. Reset the volume (see docs/deployment.md, ' +
          '"Remove the demo dataset") and boot again.'
      )
    }
    return { seeded: false }
  }

  const lea = await deps.signUp({ ...DEMO_ACCOUNTS.lea, password: DEMO_PASSWORD })
  const bob = await deps.signUp({ ...DEMO_ACCOUNTS.bob, password: DEMO_PASSWORD })
  const memberIds: Record<DemoMember, string> = { lea: lea.id, bob: bob.id }

  // groupCreate mints a random Invite secret, so the fixed one has to sit on the
  // aggregate before its first save: the adapter persists a secret only when it
  // creates the Group. The second Member then joins through the joinGroup use
  // case against that same secret.
  const group = groupCreate(groupNameFrom(DEMO_GROUP_NAME), memberOf(lea.id, lea.name))
  group.inviteSecret = DEMO_INVITE_SECRET
  await deps.groups.save(group)

  await joinGroup(deps.groups, deps.view).execute(bob.id, bob.name, DEMO_INVITE_SECRET)

  const createExpense = expenseMutation(deps.expenses, deps.view).create
  const createService = serviceMutation(deps.services, deps.view).create
  const createPayback = paybackMutation(deps.paybacks, deps.view).create

  for (const expense of DEMO_EXPENSES) {
    await createExpense.execute(memberIds[expense.payer], group.id, {
      label: expense.label,
      day: DEMO_DAY,
      amount: expense.amount,
      payerId: memberIds[expense.payer],
      participantIds: expense.participants.map(participant => memberIds[participant])
    })
  }

  await createService.execute(memberIds[DEMO_SERVICE.provider], group.id, {
    label: DEMO_SERVICE.label,
    day: DEMO_DAY,
    amount: DEMO_SERVICE.amount,
    providerId: memberIds[DEMO_SERVICE.provider],
    participantIds: DEMO_SERVICE.participants.map(participant => memberIds[participant])
  })

  // The Payback is read against the Balances the writes above derived, so the
  // cap rule holds it inside what the Debtor owes and the Creditor is owed.
  await createPayback.execute(memberIds[DEMO_PAYBACK.debtor], group.id, {
    debtorId: memberIds[DEMO_PAYBACK.debtor],
    creditorId: memberIds[DEMO_PAYBACK.creditor],
    amount: DEMO_PAYBACK.amount,
    day: DEMO_DAY
  })

  return { seeded: true, slate: await deps.view.execute(lea.id, group.id) }
}
