/** @vitest-environment happy-dom */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '../api'
import { SessionForms } from './SessionForms'

vi.mock('../api', () => ({
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

describe('SessionForms', () => {
  it('shows the sign-up form by default and offers the sign-in tab', () => {
    render(<SessionForms />)

    expect(signUpTab().getAttribute('aria-selected')).toBe('true')
    expect(signInTab().getAttribute('aria-selected')).toBe('false')
    expect(screen.getByRole('heading', { name: 'Créer un compte' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Ouvrir une session' })).toBeNull()
  })

  it('switches to the sign-in form when its tab is selected', async () => {
    const user = userEvent.setup()
    render(<SessionForms />)

    await user.click(signInTab())

    expect(signInTab().getAttribute('aria-selected')).toBe('true')
    expect(signUpTab().getAttribute('aria-selected')).toBe('false')
    expect(screen.getByRole('heading', { name: 'Ouvrir une session' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Créer un compte' })).toBeNull()
  })

  it('moves focus and selection with the arrow keys and Home/End', async () => {
    const user = userEvent.setup()
    render(<SessionForms />)

    signUpTab().focus()
    await user.keyboard('{ArrowRight}')
    expect(signInTab().getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(signInTab())
    expect(screen.getByRole('heading', { name: 'Ouvrir une session' })).toBeTruthy()

    await user.keyboard('{ArrowLeft}')
    expect(signUpTab().getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(signUpTab())

    await user.keyboard('{End}')
    expect(signInTab().getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(signInTab())

    await user.keyboard('{Home}')
    expect(signUpTab().getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(signUpTab())
  })

  it('wraps around the tab list with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<SessionForms />)

    signUpTab().focus()
    await user.keyboard('{ArrowLeft}')
    expect(signInTab().getAttribute('aria-selected')).toBe('true')

    await user.keyboard('{ArrowRight}')
    expect(signUpTab().getAttribute('aria-selected')).toBe('true')
  })

  it('submits the sign-up form to create a User', async () => {
    const user = userEvent.setup()
    render(<SessionForms />)

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
    render(<SessionForms />)

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
    render(<SessionForms />)

    await user.type(within(signUpForm()).getByLabelText('Nom affiché'), 'Léa')
    await user.type(within(signUpForm()).getByLabelText('E-mail'), 'lea@example.com')
    await user.type(within(signUpForm()).getByLabelText('Mot de passe'), 'password1234')
    await user.click(within(signUpForm()).getByRole('button', { name: 'Créer le compte' }))

    expect((await screen.findByRole('alert')).textContent).toBe('E-mail déjà utilisé')
  })
})
