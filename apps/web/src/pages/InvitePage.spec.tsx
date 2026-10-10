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

    await waitFor(() => {
      expect(window.location.pathname).toBe(`/groups/${group.id}`)
    })
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

  it('explains the shared slate to a signed-out visitor above the sign-up wall', async () => {
    const lea = api.groups(testUsers.lea)
    const group = await lea.create('Potes de Bob')
    render(
      <InvitePage secret={group.invite.secret} session={null} client={api.groups(testUsers.bob)} />
    )

    const explanation = await screen.findByText(/« Potes de Bob » est une ardoise partagée/)

    expect(explanation.textContent).toContain('découlent de ce que le Groupe enregistre')
    expect(explanation.textContent).toContain('jamais d’une saisie à la main')
    const about = screen.getByRole('link', { name: 'À propos' })
    expect(about.getAttribute('href')).toBe('/about')
    const signUpWall = screen.getByRole('tab', { name: 'Connexion' })
    expect(
      explanation.compareDocumentPosition(signUpWall) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('shows the same explanation to a Member already in the Group, above the join button', async () => {
    const lea = api.groups(testUsers.lea)
    const group = await lea.create('Potes de Bob')
    render(
      <InvitePage
        secret={group.invite.secret}
        session={{ name: 'Léa' }}
        client={api.groups(testUsers.lea)}
      />
    )

    const explanation = await screen.findByText(/« Potes de Bob » est une ardoise partagée/)

    expect(explanation.textContent).toContain('découlent de ce que le Groupe enregistre')
    expect(explanation.textContent).toContain('jamais d’une saisie à la main')
    expect(screen.getByRole('link', { name: 'À propos' }).getAttribute('href')).toBe('/about')
    const joinButton = screen.getByRole('button', { name: 'Rejoindre le Groupe' })
    expect(
      explanation.compareDocumentPosition(joinButton) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
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
