/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Group } from '../types'
import { SlateEntryFields } from './SlateEntryFields'

afterEach(cleanup)

const members: Group['members'] = [
  { userId: 'lea', name: 'Léa' },
  { userId: 'bob', name: 'Bob' }
]

// A local harness schema standing in for a vocabulary's create schema: the
// shared body only depends on the common shape (label/day/amount/subject/
// participants), so this spec must not reach into any feature's schemas.
const harnessSchema = z.object({
  label: z.string().min(1),
  day: z.string().min(1),
  amount: z.string().min(1),
  payerId: z.string().min(1),
  participantIds: z.array(z.string()).min(1)
})
type HarnessInput = z.infer<typeof harnessSchema>

type HarnessProps = {
  error?: string
  onSubmit?: (values: HarnessInput) => void
  onCancel?: () => void
}

// The shared body is exercised through one concrete subject key (payer) to
// pin the common chrome: label/day/amount/subject/participants, the noun copy,
// and the subject label. The Service shell only varies the subject key and the
// labels, both passed as props.
const Harness = ({ error = '', onSubmit = () => {}, onCancel = () => {} }: HarnessProps) => {
  const form = useForm<HarnessInput>({
    resolver: zodResolver(harnessSchema),
    defaultValues: {
      label: '',
      day: '',
      amount: '',
      payerId: 'lea',
      participantIds: ['lea', 'bob']
    }
  })

  return (
    <SlateEntryFields
      form={form}
      error={error}
      onSubmit={onSubmit}
      members={members}
      onCancel={onCancel}
      subjectField="payerId"
      subjectLabel="Payeur"
      noun="Dépense"
      article="une"
      definiteArticle="la"
    />
  )
}

describe('SlateEntryFields', () => {
  it('renders the shared body with the noun and subject copy', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { name: 'Constater une Dépense' })).toBeTruthy()
    expect((screen.getByLabelText('Libellé') as HTMLInputElement).required).toBe(true)
    const day = screen.getByLabelText('Jour') as HTMLInputElement
    expect(day.required).toBe(true)
    expect(day.type).toBe('date')
    expect((screen.getByLabelText('Montant') as HTMLInputElement).required).toBe(true)
    expect(screen.getByRole('button', { name: 'Constater la Dépense' })).toBeTruthy()
  })

  it('lists every Member as subject and as Participant', () => {
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
    const submitted: HarnessInput[] = []
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
