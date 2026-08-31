/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Group } from '~features/groups'
import { createPaybackSchema, type CreatePaybackFormInput } from '../schemas'
import { PaybackFields } from './PaybackFields'

afterEach(cleanup)

const members: Group['members'] = [
  { userId: 'lea', name: 'Léa' },
  { userId: 'bob', name: 'Bob' },
  { userId: 'camille', name: 'Camille' }
]

const creditors: Group['balances'] = [{ userId: 'lea', name: 'Léa', amount: 66 }]

type HarnessProps = {
  error?: string
  onSubmit?: (values: CreatePaybackFormInput) => void
  onCancel?: () => void
}

const Harness = ({ error = '', onSubmit = () => {}, onCancel = () => {} }: HarnessProps) => {
  const form = useForm<CreatePaybackFormInput>({
    resolver: zodResolver(createPaybackSchema),
    defaultValues: { debtorId: '', creditorId: '', amount: '', day: '' }
  })

  return (
    <PaybackFields
      form={form}
      error={error}
      onSubmit={onSubmit}
      members={members}
      creditors={creditors}
      debtorId="bob"
      creditorId="lea"
      cap={33}
      onCancel={onCancel}
    />
  )
}

describe('PaybackFields', () => {
  it('renders the French Payback form chrome with the Balances it receives', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { name: 'Qui doit quoi' })).toBeTruthy()
    expect(
      [...screen.getByLabelText('Débiteur').querySelectorAll('option')].map(
        option => option.textContent
      )
    ).toEqual(['Léa', 'Bob', 'Camille'])
    expect(
      [...screen.getByLabelText('Créancier').querySelectorAll('option')].map(
        option => option.textContent
      )
    ).toEqual(['Léa'])
    expect(screen.getByText('Plafond 0,33 €')).toBeTruthy()
    expect((screen.getByLabelText('Jour') as HTMLInputElement).required).toBe(true)
    expect(screen.getByRole('button', { name: 'Constater le Règlement' })).toBeTruthy()
  })

  it('shows the API error message passed by the container', () => {
    render(<Harness error="Groupe introuvable" />)

    expect(screen.getByRole('alert').textContent).toBe('Groupe introuvable')
  })

  it('submits the typed Amount and the selected Members to the handler', async () => {
    const submitted: CreatePaybackFormInput[] = []
    render(<Harness onSubmit={values => submitted.push(values)} />)

    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText('Débiteur'), 'bob')
    await user.type(screen.getByLabelText('Jour'), '2026-08-31')
    await user.type(screen.getByLabelText('Montant'), '0,20')
    await user.click(screen.getByRole('button', { name: 'Constater le Règlement' }))

    await waitFor(() => {
      expect(submitted).toEqual([
        { debtorId: 'bob', creditorId: '', amount: '0,20', day: '2026-08-31' }
      ])
    })
  })
})
