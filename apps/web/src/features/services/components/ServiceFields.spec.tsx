/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Group } from '~features/groups'
import { createServiceSchema, type CreateServiceFormInput } from '../schemas'
import { ServiceFields } from './ServiceFields'

afterEach(cleanup)

const members: Group['members'] = [
  { userId: 'lea', name: 'Léa' },
  { userId: 'bob', name: 'Bob' }
]

type HarnessProps = {
  error?: string
  onSubmit?: (values: CreateServiceFormInput) => void
  onCancel?: () => void
}

const Harness = ({ error = '', onSubmit = () => {}, onCancel = () => {} }: HarnessProps) => {
  const form = useForm<CreateServiceFormInput>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      label: '',
      day: '',
      amount: '',
      providerId: 'lea',
      participantIds: ['lea', 'bob']
    }
  })

  return (
    <ServiceFields
      form={form}
      error={error}
      onSubmit={onSubmit}
      members={members}
      onCancel={onCancel}
    />
  )
}

describe('ServiceFields', () => {
  it('renders the French Service form chrome', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { name: 'Constater un Service' })).toBeTruthy()
    expect((screen.getByLabelText('Libellé') as HTMLInputElement).required).toBe(true)
    expect((screen.getByLabelText('Jour') as HTMLInputElement).required).toBe(true)
    expect((screen.getByLabelText('Montant') as HTMLInputElement).required).toBe(true)
    expect(screen.getByRole('button', { name: 'Constater le Service' })).toBeTruthy()
  })

  it('lists every Member as Prestataire and as Participant', () => {
    render(<Harness />)

    expect(
      [...screen.getByLabelText('Prestataire').querySelectorAll('option')].map(
        option => option.textContent
      )
    ).toEqual(['Léa', 'Bob'])
    expect(screen.getByRole('group', { name: 'Participants' })).toBeTruthy()
  })

  it('shows the API error message passed by the container', () => {
    render(<Harness error="Groupe introuvable" />)

    expect(screen.getByRole('alert').textContent).toBe('Groupe introuvable')
  })

  it('submits the typed values to the handler', async () => {
    const submitted: CreateServiceFormInput[] = []
    render(<Harness onSubmit={values => submitted.push(values)} />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Libellé'), 'Ordi Bob')
    await user.type(screen.getByLabelText('Jour'), '2026-08-15')
    await user.type(screen.getByLabelText('Montant'), '10')
    await user.click(screen.getByRole('button', { name: 'Constater le Service' }))

    await waitFor(() => {
      expect(submitted).toEqual([
        {
          label: 'Ordi Bob',
          day: '2026-08-15',
          amount: '10',
          providerId: 'lea',
          participantIds: ['lea', 'bob']
        }
      ])
    })
  })
})
