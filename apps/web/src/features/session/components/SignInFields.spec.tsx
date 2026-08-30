/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema, type SignInFormInput } from '../schemas'
import { SignInFields } from './SignInFields'

afterEach(cleanup)

type HarnessProps = {
  error?: string
  onSubmit?: (values: SignInFormInput) => void
}

const Harness = ({ error = '', onSubmit = () => {} }: HarnessProps) => {
  const form = useForm<SignInFormInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' }
  })

  return <SignInFields form={form} error={error} onSubmit={onSubmit} />
}

describe('SignInFields', () => {
  it('renders the French sign-in form chrome', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { name: 'Ouvrir une session' })).toBeTruthy()
    expect((screen.getByLabelText('E-mail') as HTMLInputElement).required).toBe(true)
    expect((screen.getByLabelText('Mot de passe') as HTMLInputElement).required).toBe(true)
    expect(screen.getByRole('button', { name: 'Ouvrir la session' })).toBeTruthy()
  })

  it('shows the API error message passed by the container', () => {
    render(<Harness error="Identifiants invalides" />)

    expect(screen.getByRole('alert').textContent).toBe('Identifiants invalides')
  })

  it('submits the typed values to the handler', async () => {
    const submitted: SignInFormInput[] = []
    render(<Harness onSubmit={values => submitted.push(values)} />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('E-mail'), 'lea@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password1234')
    await user.click(screen.getByRole('button', { name: 'Ouvrir la session' }))

    await waitFor(() => {
      expect(submitted).toEqual([{ email: 'lea@example.com', password: 'password1234' }])
    })
  })
})
