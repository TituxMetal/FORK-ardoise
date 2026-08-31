/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  it('shows the Group name and Member count before sign-in', async () => {
    const lea = api.groups(testUsers.lea)
    const group = await lea.create('Potes de Bob')
    render(
      <InvitePage secret={group.invite.secret} session={null} client={api.groups(testUsers.bob)} />
    )

    expect(await screen.findByRole('heading', { name: 'Invitation' })).toBeTruthy()
    expect(screen.getByText('Potes de Bob')).toBeTruthy()
    expect(screen.getByText('1 membre')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Connexion' })).toBeTruthy()
  })

  it('joins the Group from a screen matching the app look', async () => {
    const lea = api.groups(testUsers.lea)
    const group = await lea.create('Potes de Bob')
    render(
      <InvitePage
        secret={group.invite.secret}
        session={{ name: 'Bob' }}
        client={api.groups(testUsers.bob)}
      />
    )

    expect(await screen.findByText('Potes de Bob')).toBeTruthy()
    expect(screen.getByText('1 membre')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Rejoindre le Groupe' }))

    expect(await screen.findByText('Bob')).toBeTruthy()
    expect(screen.getByText('2 membres')).toBeTruthy()
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
    expect(screen.getByText('Potes de Bob')).toBeTruthy()
    const unchanged = await lea.get(group.id)
    expect(unchanged.members).toHaveLength(1)
  })

  it('clears a previous error when a new Invite is previewed', async () => {
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
    expect(await screen.findByText('Potes de Bob')).toBeTruthy()
  })
})
