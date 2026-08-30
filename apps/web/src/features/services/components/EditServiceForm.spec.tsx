/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { applyGroup } from '~features/groups'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import type { ServicesClient } from '../types'
import { EditServiceForm } from './EditServiceForm'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const openWithService = async () => {
  const client = api.groups(testUsers.lea)
  const group = await client.create('Potes de Bob')
  await api.groups(testUsers.bob).join(group.invite.secret)
  await api.groups(testUsers.camille).join(group.invite.secret)
  const joined = await client.get(group.id)
  const withService = await api.services(testUsers.lea).create(joined.id, {
    label: 'Ordi Bob',
    day: '2026-08-16',
    amount: 100,
    providerId: 'lea',
    participantIds: ['lea', 'bob']
  })
  applyGroup(withService)
  return withService
}

const spyClient = (real: ServicesClient) => ({
  create: vi.fn(async (groupId: string, input: Parameters<ServicesClient['create']>[1]) =>
    real.create(groupId, input)
  ),
  update: vi.fn(
    async (groupId: string, id: string, input: Parameters<ServicesClient['update']>[2]) =>
      real.update(groupId, id, input)
  ),
  delete: vi.fn(async (groupId: string, id: string) => real.delete(groupId, id))
})

describe('EditServiceForm', () => {
  it('pre-fills the Service and submits the edit with its Participants', async () => {
    const group = await openWithService()
    const client = spyClient(api.services(testUsers.lea))
    render(<EditServiceForm serviceId={group.services[0].id} client={client} />)

    const form = screen.getByRole('form', { name: 'Modifier un Service' })
    expect((within(form).getByLabelText('Libellé') as HTMLInputElement).value).toBe('Ordi Bob')
    expect((within(form).getByLabelText('Jour') as HTMLInputElement).value).toBe('2026-08-16')
    expect((within(form).getByLabelText('Montant') as HTMLInputElement).value).toBe('1,00')
    expect((within(form).getByLabelText('Prestataire') as HTMLSelectElement).value).toBe('lea')

    const user = userEvent.setup()
    await user.clear(within(form).getByLabelText('Libellé'))
    await user.type(within(form).getByLabelText('Libellé'), 'Ordi Neuf')
    await user.clear(within(form).getByLabelText('Montant'))
    await user.type(within(form).getByLabelText('Montant'), '15,50')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => {
      expect(client.update).toHaveBeenCalledWith(group.id, group.services[0].id, {
        label: 'Ordi Neuf',
        day: '2026-08-16',
        amount: 1550,
        providerId: 'lea',
        participantIds: ['lea', 'bob']
      })
    })
  })

  it('shows the API message when the edit fails', async () => {
    const group = await openWithService()
    const client: ServicesClient = {
      create: async () => {
        throw new Error('Service introuvable')
      },
      update: async () => {
        throw new Error('Service introuvable')
      },
      delete: async () => {
        throw new Error('Service introuvable')
      }
    }
    render(<EditServiceForm serviceId={group.services[0].id} client={client} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Service introuvable')
  })
})
