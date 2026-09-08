/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema, type SignUpFormInput } from '../schemas'
import { SignUpFields } from './SignUpFields'

afterEach(cleanup)

type HarnessProps = {
  error?: string
  onSubmit?: (values: SignUpFormInput) => void
}

const Harness = ({ error = '', onSubmit = () => {} }: HarnessProps) => {
  const form = useForm<SignUpFormInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' }
  })

  return <SignUpFields form={form} error={error} onSubmit={onSubmit} />
}

describe('SignUpFields', () => {
  it('renders the French sign-up form chrome', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { name: 'Créer un compte' })).toBeTruthy()
    expect((screen.getByLabelText('Nom affiché') as HTMLInputElement).required).toBe(true)
    expect((screen.getByLabelText('E-mail') as HTMLInputElement).required).toBe(true)
    expect((screen.getByLabelText('Mot de passe') as HTMLInputElement).required).toBe(true)
    expect(screen.getByRole('button', { name: 'Créer le compte' })).toBeTruthy()
  })

  it('shows the API error message passed by the container', () => {
    render(<Harness error="E-mail déjà utilisé" />)

    expect(screen.getByRole('alert').textContent).toBe('E-mail déjà utilisé')
  })

  it('submits the typed values to the handler', async () => {
    const submitted: SignUpFormInput[] = []
    render(<Harness onSubmit={values => submitted.push(values)} />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nom affiché'), 'Léa')
    await user.type(screen.getByLabelText('E-mail'), 'lea@example.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password1234')
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }))

    await waitFor(() => {
      expect(submitted).toEqual([
        { name: 'Léa', email: 'lea@example.com', password: 'password1234' }
      ])
    })
  })
})
