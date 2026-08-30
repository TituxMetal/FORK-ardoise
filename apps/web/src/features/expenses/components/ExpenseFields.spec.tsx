/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Group } from '~features/groups'
import { createExpenseSchema, type CreateExpenseFormInput } from '../schemas'
import { ExpenseFields } from './ExpenseFields'

afterEach(cleanup)

const members: Group['members'] = [
  { userId: 'lea', name: 'Léa' },
  { userId: 'bob', name: 'Bob' }
]

type HarnessProps = {
  error?: string
  onSubmit?: (values: CreateExpenseFormInput) => void
}

const Harness = ({ error = '', onSubmit = () => {} }: HarnessProps) => {
  const form = useForm<CreateExpenseFormInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      label: '',
      day: '',
      amount: '',
      payerId: 'lea',
      participantIds: ['lea', 'bob']
    }
  })

  return <ExpenseFields form={form} error={error} onSubmit={onSubmit} members={members} />
}

describe('ExpenseFields', () => {
  it('renders the French Expense form chrome', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { name: 'Constater une Dépense' })).toBeTruthy()
    expect((screen.getByLabelText('Libellé') as HTMLInputElement).required).toBe(true)
    expect((screen.getByLabelText('Jour') as HTMLInputElement).required).toBe(true)
    expect((screen.getByLabelText('Montant') as HTMLInputElement).required).toBe(true)
    expect(screen.getByRole('button', { name: 'Constater la Dépense' })).toBeTruthy()
  })

  it('lists every Member as Payeur and as Participant', () => {
    render(<Harness />)

    expect(
      [...screen.getByLabelText('Payeur').querySelectorAll('option')].map(
        option => option.textContent
      )
    ).toEqual(['Léa', 'Bob'])
    expect(screen.getByRole('group', { name: 'Participants' })).toBeTruthy()
    expect(screen.getByLabelText('Léa')).toBeTruthy()
    expect(screen.getByLabelText('Bob')).toBeTruthy()
  })

  it('shows the API error message passed by the container', () => {
    render(<Harness error="Groupe introuvable" />)

    expect(screen.getByRole('alert').textContent).toBe('Groupe introuvable')
  })

  it('submits the typed values to the handler', async () => {
    const submitted: CreateExpenseFormInput[] = []
    render(<Harness onSubmit={values => submitted.push(values)} />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Libellé'), 'Pizza')
    await user.type(screen.getByLabelText('Jour'), '2026-08-15')
    await user.type(screen.getByLabelText('Montant'), '10')
    await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))

    await waitFor(() => {
      expect(submitted).toEqual([
        {
          label: 'Pizza',
          day: '2026-08-15',
          amount: '10',
          payerId: 'lea',
          participantIds: ['lea', 'bob']
        }
      ])
    })
  })
})
