/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { InvitePage } from '~/pages/InvitePage'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

describe('InvitePage', () => {
  it('adds a User with a session who opens the Invite as a Member', async () => {
    const lea = api.groups(testUsers.lea)
    const group = await lea.create('Potes de Bob')
    render(
      <InvitePage
        secret={group.invite.secret}
        session={{ name: 'Bob' }}
        client={api.groups(testUsers.bob)}
      />
    )

    expect(await screen.findByRole('heading', { name: 'Potes de Bob' })).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()
    const joined = await lea.get(group.id)
    expect(joined.members.map(member => member.name)).toEqual(['Léa', 'Bob'])
  })

  it('does not join when opening the Invite without a session', async () => {
    const lea = api.groups(testUsers.lea)
    const group = await lea.create('Potes de Bob')
    render(
      <InvitePage secret={group.invite.secret} session={null} client={api.groups(testUsers.bob)} />
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Invitation' })).toBeTruthy()
    })
    expect(screen.getByRole('heading', { name: 'Ouvrir une session' })).toBeTruthy()
    const unchanged = await lea.get(group.id)
    expect(unchanged.members).toHaveLength(1)
  })

  it('clears a previous error when a new Invite is joined', async () => {
    const lea = api.groups(testUsers.lea)
    const group = await lea.create('Potes de Bob')
    const { rerender } = render(
      <InvitePage
        secret="bad-secret"
        session={{ name: 'Bob' }}
        client={api.groups(testUsers.bob)}
      />
    )
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Invitation introuvable')
    })

    rerender(
      <InvitePage
        secret={group.invite.secret}
        session={{ name: 'Bob' }}
        client={api.groups(testUsers.bob)}
      />
    )
    expect(await screen.findByRole('heading', { name: 'Potes de Bob' })).toBeTruthy()
  })
})
