/** @vitest-environment happy-dom */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '~features/session'
import { AuthPage } from './AuthPage'

vi.mock('~features/session/api', () => ({
  authClient: {
    signUp: { email: vi.fn(async () => ({ data: null, error: null })) },
    signIn: { email: vi.fn(async () => ({ data: null, error: null })) }
  }
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const signUpTab = () => screen.getByRole('tab', { name: 'Inscription' })
const signInTab = () => screen.getByRole('tab', { name: 'Connexion' })
const signUpForm = () =>
  screen.getByRole('heading', { name: 'Créer un compte' }).closest('form') as HTMLFormElement
const signInForm = () =>
  screen.getByRole('heading', { name: 'Ouvrir une session' }).closest('form') as HTMLFormElement

describe('AuthPage', () => {
  it('shows the sign-up form by default and offers the sign-in tab', () => {
    render(<AuthPage />)

    expect(signUpTab().getAttribute('aria-selected')).toBe('true')
    expect(signInTab().getAttribute('aria-selected')).toBe('false')
    expect(screen.getByRole('heading', { name: 'Créer un compte' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Ouvrir une session' })).toBeNull()
  })

  it('switches to the sign-in form when its tab is selected', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.click(signInTab())

    expect(signInTab().getAttribute('aria-selected')).toBe('true')
    expect(signUpTab().getAttribute('aria-selected')).toBe('false')
    expect(screen.getByRole('heading', { name: 'Ouvrir une session' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Créer un compte' })).toBeNull()
  })

  it('submits the sign-up form to create a User', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.type(within(signUpForm()).getByLabelText('Nom affiché'), 'Léa')
    await user.type(within(signUpForm()).getByLabelText('E-mail'), 'lea@example.com')
    await user.type(within(signUpForm()).getByLabelText('Mot de passe'), 'password1234')
    await user.click(within(signUpForm()).getByRole('button', { name: 'Créer le compte' }))

    expect(authClient.signUp.email).toHaveBeenCalledWith({
      email: 'lea@example.com',
      password: 'password1234',
      name: 'Léa'
    })
  })

  it('submits the sign-in form to open a session', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.click(signInTab())
    await user.type(within(signInForm()).getByLabelText('E-mail'), 'lea@example.com')
    await user.type(within(signInForm()).getByLabelText('Mot de passe'), 'password1234')
    await user.click(within(signInForm()).getByRole('button', { name: 'Ouvrir la session' }))

    expect(authClient.signIn.email).toHaveBeenCalledWith({
      email: 'lea@example.com',
      password: 'password1234'
    })
  })

  it('shows the API error message', async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      error: { message: 'E-mail déjà utilisé' }
    } as never)
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.type(within(signUpForm()).getByLabelText('Nom affiché'), 'Léa')
    await user.type(within(signUpForm()).getByLabelText('E-mail'), 'lea@example.com')
    await user.type(within(signUpForm()).getByLabelText('Mot de passe'), 'password1234')
    await user.click(within(signUpForm()).getByRole('button', { name: 'Créer le compte' }))

    expect((await screen.findByRole('alert')).textContent).toBe('E-mail déjà utilisé')
  })
})
