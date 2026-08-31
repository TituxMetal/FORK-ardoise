import type { BalanceDto, GroupDto, MemberDto } from '~/groups/application/group.dto'

const defaultMembers: MemberDto[] = [
  { userId: 'u1', name: 'Léa' },
  { userId: 'u2', name: 'Bob' }
]

export type SlateFixtureOverrides = {
  members?: MemberDto[]
  balances?: BalanceDto[]
}

/** A canned Slate (GroupDto) for mutation specs, defaulting to two Members with zero Balances. */
export const slateFixture = (overrides: SlateFixtureOverrides = {}): GroupDto => {
  const members = overrides.members ?? defaultMembers
  const balances = overrides.balances ?? members.map(member => ({ ...member, amount: 0 }))
  return {
    id: 'g1',
    name: 'Potes de Bob',
    selfMemberId: 'u1',
    members,
    invite: { secret: 'secret' },
    expenses: [],
    services: [],
    paybacks: [],
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
