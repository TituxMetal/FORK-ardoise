/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import type { GroupDto, GroupsClient } from '~features/groups/client'
import { InvitePage } from '~/pages/InvitePage'

afterEach(cleanup)

const group: GroupDto = {
  id: 'g1',
  name: 'Potes de Bob',
  members: [
    { userId: 'lea', name: 'Léa' },
    { userId: 'bob', name: 'Bob' }
  ],
  invite: { secret: 'invite-secret' },
  expenses: [],
  services: [],
  paybacks: [],
  balances: [
    { userId: 'lea', name: 'Léa', amount: 0 },
    { userId: 'bob', name: 'Bob', amount: 0 }
  ]
}

const joiningClient = (joined: string[]) =>
  ({
    list: async () => [],
    create: async () => group,
    get: async () => group,
    join: async secret => {
      joined.push(secret)
      return group
    },
    createExpense: async () => group,
    deleteExpense: async () => group,
    createService: async () => group,
    deleteService: async () => group,
    createPayback: async () => group,
    deletePayback: async () => group
  }) satisfies GroupsClient

describe('InvitePage', () => {
  it('adds a User with a session who opens the Invite as a Member', async () => {
    const joined: string[] = []
    render(
      <InvitePage secret="invite-secret" session={{ name: 'Bob' }} client={joiningClient(joined)} />
    )

    expect(await screen.findByRole('heading', { name: 'Potes de Bob' })).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()
    expect(joined).toEqual(['invite-secret'])
  })

  it('does not join when opening the Invite without a session', async () => {
    const joined: string[] = []
    render(<InvitePage secret="invite-secret" session={null} client={joiningClient(joined)} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Invitation' })).toBeTruthy()
    })
    expect(joined).toEqual([])
    expect(screen.getByRole('heading', { name: 'Ouvrir une session' })).toBeTruthy()
  })

  it('clears a previous error when a new Invite is joined', async () => {
    const client = {
      ...joiningClient([]),
      join: async (secret: string) => {
        if (secret === 'bad') {
          throw new Error('Invitation introuvable')
        }
        return group
      }
    }
    const { rerender } = render(
      <InvitePage secret="bad" session={{ name: 'Bob' }} client={client} />
    )
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Invitation introuvable')
    })

    rerender(<InvitePage secret="invite-secret" session={{ name: 'Bob' }} client={client} />)
    expect(await screen.findByRole('heading', { name: 'Potes de Bob' })).toBeTruthy()
  })
})
