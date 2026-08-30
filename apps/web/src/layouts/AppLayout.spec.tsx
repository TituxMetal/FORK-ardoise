/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '~features/session/api'
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
  it('renders the title and its children', () => {
    render(
      <AppLayout session={null}>
        <p>Contenu</p>
      </AppLayout>
    )

    expect(screen.getByRole('heading', { name: 'Ardoise' })).toBeTruthy()
    expect(screen.getByText('Contenu')).toBeTruthy()
  })

  it('links the signed-in Member to the Profile page', () => {
    render(
      <AppLayout session={{ name: 'Léa' }}>
        <p>Contenu</p>
      </AppLayout>
    )

    expect(screen.getByRole('link', { name: 'Profil' }).getAttribute('href')).toBe('/profile')
  })

  it('closes the session when the Member asks to', async () => {
    const user = userEvent.setup()
    render(
      <AppLayout session={{ name: 'Léa' }}>
        <p>Contenu</p>
      </AppLayout>
    )

    await user.click(screen.getByRole('button', { name: 'Fermer la session' }))

    expect(authClient.signOut).toHaveBeenCalled()
  })

  it('hides the session panel without an open session', () => {
    render(
      <AppLayout session={null}>
        <p>Contenu</p>
      </AppLayout>
    )

    expect(screen.queryByText('Session ouverte :')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Fermer la session' })).toBeNull()
  })
})
