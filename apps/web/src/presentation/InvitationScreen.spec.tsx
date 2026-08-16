/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test } from 'vite-plus/test'
import type { GroupeDto, GroupesClient } from '../infrastructure/CreateGroupes.client.ts'
import { InvitationScreen } from './InvitationScreen.tsx'

afterEach(cleanup)

const groupe: GroupeDto = {
  id: 'g1',
  name: 'Potes de Bob',
  members: [
    { userId: 'lea', name: 'Léa' },
    { userId: 'bob', name: 'Bob' }
  ],
  invitation: { secret: 'invite-secret' },
  expenses: [],
  services: [],
  settlements: [],
  balances: [
    { userId: 'lea', name: 'Léa', amount: 0 },
    { userId: 'bob', name: 'Bob', amount: 0 }
  ]
}

const joiningClient = (joined: string[]) =>
  ({
    list: async () => [],
    create: async () => groupe,
    get: async () => groupe,
    join: async secret => {
      joined.push(secret)
      return groupe
    },
    createExpense: async () => groupe,
    deleteExpense: async () => groupe,
    createService: async () => groupe,
    deleteService: async () => groupe
  }) satisfies GroupesClient

test('a User with a session who opens the Invitation becomes Membre', async () => {
  const joined: string[] = []
  render(
    <InvitationScreen
      secret="invite-secret"
      session={{ name: 'Bob' }}
      client={joiningClient(joined)}
    />
  )

  expect(await screen.findByRole('heading', { name: 'Potes de Bob' })).toBeTruthy()
  expect(screen.getByText('Bob')).toBeTruthy()
  expect(joined).toEqual(['invite-secret'])
})

test('opening the Invitation without a session does not write', async () => {
  const joined: string[] = []
  render(<InvitationScreen secret="invite-secret" session={null} client={joiningClient(joined)} />)

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Invitation' })).toBeTruthy()
  })
  expect(joined).toEqual([])
  expect(screen.getByRole('heading', { name: 'Ouvrir une session' })).toBeTruthy()
})
