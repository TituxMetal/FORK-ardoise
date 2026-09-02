import type { BalanceDto, GroupDto, MemberDto, PaybackDto } from '~/groups/application'

const defaultMembers: MemberDto[] = [
  { userId: 'u1', name: 'Léa' },
  { userId: 'u2', name: 'Bob' }
]

export type SlateFixtureOverrides = {
  members?: MemberDto[]
  balances?: BalanceDto[]
  paybacks?: PaybackDto[]
}

/** A canned Slate (GroupDto) for mutation specs, defaulting to two Members with zero Balances. */
export const slateFixture = (overrides: SlateFixtureOverrides = {}): GroupDto => {
  // A fresh array (and element copies) so a test mutating the returned
  // members cannot leak into later tests via the module-level default.
  const members = overrides.members ?? defaultMembers.map(member => ({ ...member }))
  const balances = overrides.balances ?? members.map(member => ({ ...member, amount: 0 }))
  return {
    id: 'g1',
    name: 'Potes de Bob',
    selfMemberId: 'u1',
    members,
    invite: { secret: 'secret' },
    expenses: [],
    services: [],
    paybacks: overrides.paybacks ?? [],
    balances
  }
}

/** A SlateView whose reads are recorded as `userId:groupId`; the skeleton reads it twice. */
export const viewFixture = (calls: string[], slate: GroupDto) => ({
  execute: async (userId: string, groupId: string) => {
    calls.push(`${userId}:${groupId}`)
    return slate
  }
})
