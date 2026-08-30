/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { zodResolver } from '@hookform/resolvers/zod'
import { createGroupSchema, type CreateGroupInput } from '../schemas'
import { CreateGroupFields } from './CreateGroupFields'

afterEach(cleanup)

type HarnessProps = {
  error?: string
  onSubmit?: (values: CreateGroupInput) => void
}

const Harness = ({ error = '', onSubmit = () => {} }: HarnessProps) => {
  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: '' }
  })

  return <CreateGroupFields form={form} error={error} onSubmit={onSubmit} />
}

describe('CreateGroupFields', () => {
  it('renders the French form chrome', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { name: 'Créer un Groupe' })).toBeTruthy()
    expect(screen.getByLabelText('Nom')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Créer le Groupe' })).toBeTruthy()
  })

  it('shows the API error message passed by the container', () => {
    render(<Harness error="Groupe introuvable" />)

    expect(screen.getByRole('alert').textContent).toBe('Groupe introuvable')
  })

  it('submits the typed name to the handler', async () => {
    const submitted: CreateGroupInput[] = []
    render(<Harness onSubmit={values => submitted.push(values)} />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nom'), 'Potes de Bob')
    await user.click(screen.getByRole('button', { name: 'Créer le Groupe' }))

    await waitFor(() => {
      expect(submitted).toEqual([{ name: 'Potes de Bob' }])
    })
  })
})
