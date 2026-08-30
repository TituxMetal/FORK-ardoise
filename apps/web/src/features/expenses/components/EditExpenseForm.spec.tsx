/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { applyGroup } from '~features/groups'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import type { ExpensesClient } from '../types'
import { EditExpenseForm } from './EditExpenseForm'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const openWithExpense = async () => {
  const client = api.groups(testUsers.lea)
  const group = await client.create('Potes de Bob')
  await api.groups(testUsers.bob).join(group.invite.secret)
  await api.groups(testUsers.camille).join(group.invite.secret)
  const joined = await client.get(group.id)
  const withExpense = await api.expenses(testUsers.lea).create(joined.id, {
    label: 'Pizza',
    day: '2026-08-15',
    amount: 100,
    payerId: 'lea',
    participantIds: ['lea', 'bob']
  })
  applyGroup(withExpense)
  return withExpense
}

const spyClient = (real: ExpensesClient) => ({
  create: vi.fn(async (groupId: string, input: Parameters<ExpensesClient['create']>[1]) =>
    real.create(groupId, input)
  ),
  update: vi.fn(
    async (groupId: string, id: string, input: Parameters<ExpensesClient['update']>[2]) =>
      real.update(groupId, id, input)
  ),
  delete: vi.fn(async (groupId: string, id: string) => real.delete(groupId, id))
})

describe('EditExpenseForm', () => {
  it('pre-fills the Expense and submits the edit with its Participants', async () => {
    const group = await openWithExpense()
    const client = spyClient(api.expenses(testUsers.lea))
    render(<EditExpenseForm expenseId={group.expenses[0].id} client={client} />)

    const form = screen.getByRole('form', { name: 'Modifier une Dépense' })
    expect((within(form).getByLabelText('Libellé') as HTMLInputElement).value).toBe('Pizza')
    expect((within(form).getByLabelText('Jour') as HTMLInputElement).value).toBe('2026-08-15')
    expect((within(form).getByLabelText('Montant') as HTMLInputElement).value).toBe('1,00')
    expect((within(form).getByLabelText('Payeur') as HTMLSelectElement).value).toBe('lea')

    const user = userEvent.setup()
    await user.clear(within(form).getByLabelText('Libellé'))
    await user.type(within(form).getByLabelText('Libellé'), 'Pizza géante')
    await user.clear(within(form).getByLabelText('Montant'))
    await user.type(within(form).getByLabelText('Montant'), '15,50')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => {
      expect(client.update).toHaveBeenCalledWith(group.id, group.expenses[0].id, {
        label: 'Pizza géante',
        day: '2026-08-15',
        amount: 1550,
        payerId: 'lea',
        participantIds: ['lea', 'bob']
      })
    })
  })

  it('shows the API message when the edit fails', async () => {
    const group = await openWithExpense()
    const client: ExpensesClient = {
      create: async () => {
        throw new Error('Dépense introuvable')
      },
      update: async () => {
        throw new Error('Dépense introuvable')
      },
      delete: async () => {
        throw new Error('Dépense introuvable')
      }
    }
    render(<EditExpenseForm expenseId={group.expenses[0].id} client={client} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Dépense introuvable')
  })

  it('lets Annuler discard the draft and report the close', async () => {
    const group = await openWithExpense()
    const onCancel = vi.fn()
    render(
      <EditExpenseForm
        expenseId={group.expenses[0].id}
        client={api.expenses(testUsers.lea)}
        onCancel={onCancel}
      />
    )

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Modifier une Dépense' })
    await user.clear(within(form).getByLabelText('Libellé'))
    await user.type(within(form).getByLabelText('Libellé'), 'Pizza géante')
    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(onCancel).toHaveBeenCalled()
    expect((within(form).getByLabelText('Libellé') as HTMLInputElement).value).toBe('Pizza')
  })
})
