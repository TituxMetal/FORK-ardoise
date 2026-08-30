/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { applyGroup } from '~features/groups'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import type { ExpensesClient } from '../types'
import { ExpenseForm } from './ExpenseForm'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const openGroup = async () => {
  const client = api.groups(testUsers.lea)
  const group = await client.create('Potes de Bob')
  await api.groups(testUsers.bob).join(group.invite.secret)
  applyGroup(await client.get(group.id))
  return group
}

const spyClient = (
  real: ExpensesClient
): ExpensesClient & { create: ReturnType<typeof vi.fn> } => ({
  create: vi.fn(async (groupId: string, input: Parameters<ExpensesClient['create']>[1]) =>
    real.create(groupId, input)
  ),
  delete: vi.fn(async (groupId: string, id: string) => real.delete(groupId, id))
})

describe('ExpenseForm', () => {
  it('submits the trimmed fields with the Amount in cents and the default Participants', async () => {
    const group = await openGroup()
    const client = spyClient(api.expenses(testUsers.lea))
    render(<ExpenseForm client={client} />)

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater une Dépense' })
    await user.type(within(form).getByLabelText('Libellé'), 'Pizza')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '10,50')
    await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))

    await waitFor(() => {
      expect(client.create).toHaveBeenCalledWith(group.id, {
        label: 'Pizza',
        day: '2026-08-15',
        amount: 1050,
        payerId: 'lea',
        participantIds: ['lea', 'bob']
      })
    })
  })

  it('shows the API message when the creation fails', async () => {
    await openGroup()
    const client: ExpensesClient = {
      create: async () => {
        throw new Error('Groupe introuvable')
      },
      delete: async () => {
        throw new Error('Groupe introuvable')
      }
    }
    render(<ExpenseForm client={client} />)

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater une Dépense' })
    await user.type(within(form).getByLabelText('Libellé'), 'Pizza')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '10')
    await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Groupe introuvable')
  })

  it('rejects invalid input with French messages without calling the API', async () => {
    await openGroup()
    const client = spyClient(api.expenses(testUsers.lea))
    render(<ExpenseForm client={client} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.map(alert => alert.textContent)).toContain('Libellé requis')
    expect(client.create).not.toHaveBeenCalled()
  })

  it('rejects unchecking every participant without calling the API', async () => {
    await openGroup()
    const client = spyClient(api.expenses(testUsers.lea))
    render(<ExpenseForm client={client} />)

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater une Dépense' })
    await user.type(within(form).getByLabelText('Libellé'), 'Pizza')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '10')
    for (const checkbox of screen.getAllByRole('checkbox')) {
      await user.click(checkbox)
    }
    await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.map(alert => alert.textContent)).toContain('Au moins un participant requis')
    expect(client.create).not.toHaveBeenCalled()
  })
})
