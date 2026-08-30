/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { applyGroup } from '~features/groups'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import type { PaybacksClient } from '../types'
import { PaybackForm } from './PaybackForm'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const openForm = async () => {
  const client = api.groups(testUsers.lea)
  const group = await client.create('Potes de Bob')
  await api.groups(testUsers.bob).join(group.invite.secret)
  await api.expenses(testUsers.lea).create(group.id, {
    label: 'Pizza',
    day: '2026-08-15',
    amount: 100,
    payerId: 'lea'
  })
  applyGroup(await client.get(group.id))
  return { client, group }
}

const spyClient = (
  real: PaybacksClient
): PaybacksClient & { create: ReturnType<typeof vi.fn> } => ({
  create: vi.fn(async (groupId: string, input: Parameters<PaybacksClient['create']>[1]) =>
    real.create(groupId, input)
  ),
  delete: vi.fn(async (groupId: string, id: string) => real.delete(groupId, id))
})

describe('PaybackForm', () => {
  it('defaults to the debtor with a negative Balance and submits the Amount in cents', async () => {
    const { client, group } = await openForm()
    const spy = spyClient(api.paybacks(testUsers.lea))
    render(<PaybackForm client={spy} />)

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater un Règlement' })
    expect(within(form).getByText('Plafond 0,50 €')).toBeTruthy()
    await user.type(within(form).getByLabelText('Montant'), '0,20')
    await user.click(screen.getByRole('button', { name: 'Constater le Règlement' }))

    await waitFor(() => {
      expect(spy.create).toHaveBeenCalledWith(group.id, {
        debtorId: 'bob',
        creditorId: 'lea',
        amount: 20
      })
    })
    const next = await client.get(group.id)
    expect(next.paybacks).toHaveLength(1)
  })

  it('shows the API message when the creation fails', async () => {
    await openForm()
    const client: PaybacksClient = {
      create: async () => {
        throw new Error('Groupe introuvable')
      },
      delete: async () => {
        throw new Error('Groupe introuvable')
      }
    }
    render(<PaybackForm client={client} />)

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater un Règlement' })
    await user.type(within(form).getByLabelText('Montant'), '0,20')
    await user.click(screen.getByRole('button', { name: 'Constater le Règlement' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Groupe introuvable')
  })

  it('rejects an invalid Amount with a French message without calling the API', async () => {
    await openForm()
    const spy = spyClient(api.paybacks(testUsers.lea))
    render(<PaybackForm client={spy} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Constater le Règlement' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Montant > 0 requis')
    expect(spy.create).not.toHaveBeenCalled()
  })
})
