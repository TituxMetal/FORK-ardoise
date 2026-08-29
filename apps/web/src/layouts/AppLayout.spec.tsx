/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '~/lib/authClient'
import { AppLayout } from './AppLayout'

vi.mock('~/lib/authClient', () => ({
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

  it('welcomes the Member of an open session', () => {
    render(
      <AppLayout session={{ name: 'Léa' }}>
        <p>Contenu</p>
      </AppLayout>
    )

    expect(screen.getByText('Session ouverte : Léa')).toBeTruthy()
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
