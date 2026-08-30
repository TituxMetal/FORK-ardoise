/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '../api'
import { SignUpForm } from './SignUpForm'

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

describe('SignUpForm', () => {
  it('creates a User on submit', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Nom affiché'), 'Léa')
    await user.type(screen.getByLabelText('E-mail'), 'lea@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password1234')
    await user.click(screen.getByRole('button', { name: 'Créer le User' }))

    expect(authClient.signUp.email).toHaveBeenCalledWith({
      email: 'lea@example.com',
      password: 'password1234',
      name: 'Léa'
    })
  })

  it('shows the API error message', async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      error: { message: 'E-mail déjà utilisé' }
    } as never)
    const user = userEvent.setup()
    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Nom affiché'), 'Léa')
    await user.type(screen.getByLabelText('E-mail'), 'lea@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password1234')
    await user.click(screen.getByRole('button', { name: 'Créer le User' }))

    expect((await screen.findByRole('alert')).textContent).toBe('E-mail déjà utilisé')
  })

  it('rejects invalid input with a French message without calling the API', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    await user.click(screen.getByRole('button', { name: 'Créer le User' }))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.map(alert => alert.textContent)).toContain('Nom requis')
    expect(authClient.signUp.email).not.toHaveBeenCalled()
  })
})
