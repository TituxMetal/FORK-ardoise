/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateNameSchema, type UpdateNameInput } from '../schemas'
import { ProfileFields } from './ProfileFields'

afterEach(cleanup)

type HarnessProps = {
  error?: string
  saved?: boolean
  onSubmit?: (values: UpdateNameInput) => void
}

const Harness = ({ error = '', saved = false, onSubmit = () => {} }: HarnessProps) => {
  const form = useForm<UpdateNameInput>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: { name: '' }
  })

  return <ProfileFields form={form} error={error} saved={saved} onSubmit={onSubmit} />
}

describe('ProfileFields', () => {
  it('renders the French form chrome', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { name: 'Modifier mon nom' })).toBeTruthy()
    const name = screen.getByLabelText('Nom') as HTMLInputElement
    expect(name.required).toBe(true)
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeTruthy()
  })

  it('shows the API error message passed by the container', () => {
    render(<Harness error="Impossible de modifier le nom" />)

    expect(screen.getByRole('alert').textContent).toBe('Impossible de modifier le nom')
  })

  it('announces a saved rename', () => {
    render(<Harness saved />)

    expect(screen.getByRole('status').textContent).toBe('Nom modifié')
  })

  it('submits the typed name to the handler', async () => {
    const submitted: UpdateNameInput[] = []
    render(<Harness onSubmit={values => submitted.push(values)} />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nom'), 'Léa P.')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => {
      expect(submitted).toEqual([{ name: 'Léa P.' }])
    })
  })
})
