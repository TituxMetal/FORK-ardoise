/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { applyGroup } from '~features/groups'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import type { PaybacksClient } from '../types'
import { EditPaybackForm } from './EditPaybackForm'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const openWithPayback = async () => {
  const client = api.groups(testUsers.lea)
  const group = await client.create('Potes de Bob')
  await api.groups(testUsers.bob).join(group.invite.secret)
  await api.groups(testUsers.camille).join(group.invite.secret)
  const joined = await client.get(group.id)
  await api.expenses(testUsers.lea).create(joined.id, {
    label: 'Pizza',
    day: '2026-08-15',
    amount: 300,
    payerId: 'lea',
    participantIds: ['lea', 'bob', 'camille']
  })
  const withPayback = await api.paybacks(testUsers.lea).create(joined.id, {
    debtorId: 'bob',
    creditorId: 'lea',
    amount: 20
  })
  applyGroup(withPayback)
  return withPayback
}

const spyClient = (real: PaybacksClient) => ({
  create: vi.fn(async (groupId: string, input: Parameters<PaybacksClient['create']>[1]) =>
    real.create(groupId, input)
  ),
  update: vi.fn(
    async (groupId: string, id: string, input: Parameters<PaybacksClient['update']>[2]) =>
      real.update(groupId, id, input)
  ),
  delete: vi.fn(async (groupId: string, id: string) => real.delete(groupId, id))
})

describe('EditPaybackForm', () => {
  it('pre-fills the Payback and submits the edit with the cap without it', async () => {
    const group = await openWithPayback()
    const client = spyClient(api.paybacks(testUsers.lea))
    render(<EditPaybackForm paybackId={group.paybacks[0].id} client={client} />)

    const form = screen.getByRole('form', { name: 'Modifier le Règlement' })
    expect((within(form).getByLabelText('Débiteur') as HTMLSelectElement).value).toBe('bob')
    expect((within(form).getByLabelText('Créancier') as HTMLSelectElement).value).toBe('lea')
    expect((within(form).getByLabelText('Montant') as HTMLInputElement).value).toBe('0,20')
    // Without the 20 payback Bob owes 100: the cap is the remaining debt.
    expect(within(form).getByText('Plafond 1,00 €')).toBeTruthy()

    const user = userEvent.setup()
    await user.clear(within(form).getByLabelText('Montant'))
    await user.type(within(form).getByLabelText('Montant'), '1,00')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => {
      expect(client.update).toHaveBeenCalledWith(group.id, group.paybacks[0].id, {
        debtorId: 'bob',
        creditorId: 'lea',
        amount: 100
      })
    })
  })

  it('shows the API message when the edit fails', async () => {
    const group = await openWithPayback()
    const client: PaybacksClient = {
      create: async () => {
        throw new Error('Règlement introuvable')
      },
      update: async () => {
        throw new Error('Règlement introuvable')
      },
      delete: async () => {
        throw new Error('Règlement introuvable')
      }
    }
    render(<EditPaybackForm paybackId={group.paybacks[0].id} client={client} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Règlement introuvable')
  })
})
