/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { authClient } from '../api'
import { SignInForm } from './SignInForm'

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

describe('SignInForm', () => {
  it('opens a session on submit', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)

    await user.type(screen.getByLabelText('E-mail'), 'lea@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password1234')
    await user.click(screen.getByRole('button', { name: 'Ouvrir la session' }))

    expect(authClient.signIn.email).toHaveBeenCalledWith({
      email: 'lea@example.com',
      password: 'password1234'
    })
  })

  it('shows the API error message', async () => {
    vi.mocked(authClient.signIn.email).mockResolvedValue({
      error: { message: 'Identifiants invalides' }
    } as never)
    const user = userEvent.setup()
    render(<SignInForm />)

    await user.type(screen.getByLabelText('E-mail'), 'lea@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Ouvrir la session' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Identifiants invalides')
  })

  it('rejects invalid input with a French message without calling the API', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)

    await user.click(screen.getByRole('button', { name: 'Ouvrir la session' }))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.map(alert => alert.textContent)).toContain('E-mail requis')
    expect(authClient.signIn.email).not.toHaveBeenCalled()
  })
})
