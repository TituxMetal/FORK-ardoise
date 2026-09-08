/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '~features/session'
import { AppLayout } from './AppLayout'

vi.mock('~features/session/api', () => ({
  authClient: {
    signOut: vi.fn()
  }
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AppLayout', () => {
  it('renders the title and children without the shell while signed out', () => {
    render(
      <AppLayout session={null} currentRoute="groups">
        <p>Contenu</p>
      </AppLayout>
    )

    expect(screen.getByRole('heading', { name: 'Ardoise' })).toBeTruthy()
    expect(screen.getByText('Contenu')).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).toBeNull()
    expect(screen.queryByText('Session ouverte :')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Fermer la session' })).toBeNull()
  })

  it('renders the two first-level destinations at both breakpoints for an open session', () => {
    render(
      <AppLayout session={{ name: 'Léa' }} currentRoute="groups">
        <p>Contenu</p>
      </AppLayout>
    )

    expect(screen.getByRole('heading', { name: 'Ardoise' })).toBeTruthy()
    expect(screen.getAllByRole('navigation', { name: 'Navigation principale' })).toHaveLength(2)

    const groupsLinks = screen.getAllByRole('link', { name: 'Mes Groupes' })
    expect(groupsLinks).toHaveLength(2)
    expect(groupsLinks.every(link => link.getAttribute('href') === '/')).toBeTruthy()
    expect(groupsLinks.every(link => link.getAttribute('aria-current') === 'page')).toBeTruthy()

    const profileLinks = screen.getAllByRole('link', { name: 'Profil' })
    expect(profileLinks).toHaveLength(2)
    expect(profileLinks.every(link => link.getAttribute('href') === '/profile')).toBeTruthy()
    expect(profileLinks.every(link => link.getAttribute('aria-current') === null)).toBeTruthy()

    expect(screen.getAllByText('Session ouverte : Léa')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Fermer la session' })).toHaveLength(2)
  })

  it('marks Profil as the current destination on the Profile page', () => {
    render(
      <AppLayout session={{ name: 'Léa' }} currentRoute="profile">
        <p>Contenu</p>
      </AppLayout>
    )

    const profileLinks = screen.getAllByRole('link', { name: 'Profil' })
    expect(profileLinks.every(link => link.getAttribute('aria-current') === 'page')).toBeTruthy()

    const groupsLinks = screen.getAllByRole('link', { name: 'Mes Groupes' })
    expect(groupsLinks.every(link => link.getAttribute('aria-current') === null)).toBeTruthy()
  })

  it('keeps Mes Groupes current inside a Group screen', () => {
    render(
      <AppLayout session={{ name: 'Léa' }} currentRoute="group">
        <p>Contenu</p>
      </AppLayout>
    )

    const groupsLinks = screen.getAllByRole('link', { name: 'Mes Groupes' })
    expect(groupsLinks.every(link => link.getAttribute('aria-current') === 'page')).toBeTruthy()

    const profileLinks = screen.getAllByRole('link', { name: 'Profil' })
    expect(profileLinks.every(link => link.getAttribute('aria-current') === null)).toBeTruthy()
  })

  it('hides the shell on the Invite screen even with an open session', () => {
    render(
      <AppLayout session={{ name: 'Léa' }} currentRoute="invite">
        <p>Contenu</p>
      </AppLayout>
    )

    expect(screen.getByText('Contenu')).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Fermer la session' })).toBeNull()
  })

  it('closes the session when the Member asks to', async () => {
    const user = userEvent.setup()
    render(
      <AppLayout session={{ name: 'Léa' }} currentRoute="groups">
        <p>Contenu</p>
      </AppLayout>
    )

    await user.click(screen.getAllByRole('button', { name: 'Fermer la session' })[0])

    expect(authClient.signOut).toHaveBeenCalled()
  })
})
