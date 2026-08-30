/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { zodResolver } from '@hookform/resolvers/zod'
import { renameGroupSchema, type RenameGroupInput } from '../schemas'
import { RenameGroupFields } from './RenameGroupFields'

afterEach(cleanup)

type HarnessProps = {
  error?: string
  onSubmit?: (values: RenameGroupInput) => void
  onCancel?: () => void
}

const Harness = ({ error = '', onSubmit = () => {}, onCancel = () => {} }: HarnessProps) => {
  const form = useForm<RenameGroupInput>({
    resolver: zodResolver(renameGroupSchema),
    defaultValues: { name: 'Potes de Bob' }
  })

  return <RenameGroupFields form={form} error={error} onSubmit={onSubmit} onCancel={onCancel} />
}

describe('RenameGroupFields', () => {
  it('renders the French form chrome', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { name: 'Renommer le Groupe' })).toBeTruthy()
    const name = screen.getByLabelText('Nom') as HTMLInputElement
    expect(name.required).toBe(true)
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeTruthy()
  })

  it('shows the API error message passed by the container', () => {
    render(<Harness error="Groupe introuvable" />)

    expect(screen.getByRole('alert').textContent).toBe('Groupe introuvable')
  })

  it('submits the typed name to the handler', async () => {
    const submitted: RenameGroupInput[] = []
    render(<Harness onSubmit={values => submitted.push(values)} />)

    const user = userEvent.setup()
    const name = screen.getByLabelText('Nom') as HTMLInputElement
    await user.clear(name)
    await user.type(name, 'Soirée de Bob')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => {
      expect(submitted).toEqual([{ name: 'Soirée de Bob' }])
    })
  })

  it('notifies the container when the user cancels', async () => {
    const cancelled: string[] = []
    render(<Harness onCancel={() => cancelled.push('cancelled')} />)

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(cancelled).toEqual(['cancelled'])
  })
})
