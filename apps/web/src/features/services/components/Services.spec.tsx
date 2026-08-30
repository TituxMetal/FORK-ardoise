/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { applyGroup, cancelEdit } from '~features/groups'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { Services } from './Services'

afterEach(cleanup)
afterEach(() => cancelEdit())
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const openWithOrdi = async () => {
  const client = api.groups(testUsers.lea)
  const group = await client.create('Potes de Bob')
  await api.groups(testUsers.bob).join(group.invite.secret)
  await api.services(testUsers.lea).create(group.id, {
    label: 'Ordi Bob',
    day: '2026-08-16',
    amount: 100,
    providerId: 'lea',
    participantIds: ['lea', 'bob']
  })
  applyGroup(await client.get(group.id))
  render(<Services client={api.services(testUsers.lea)} />)
}

describe('Services', () => {
  it('lists the Services of the Slate as shared rows', async () => {
    await openWithOrdi()

    expect(screen.getByText('LÉ')).toBeTruthy()
    expect(screen.getByText('Ordi Bob')).toBeTruthy()
    expect(screen.getByText('Léa · 16 août')).toBeTruthy()
    expect(screen.getByText('1,00 €')).toBeTruthy()
  })

  it('shows an empty Slate when the Group has no Service', async () => {
    const client = api.groups(testUsers.lea)
    const group = await client.create('Potes de Bob')
    applyGroup(await client.get(group.id))
    render(<Services client={api.services(testUsers.lea)} />)

    expect(screen.getByText('Aucun Service')).toBeTruthy()
  })

  it('deletes a Service only after the confirmation is confirmed', async () => {
    await openWithOrdi()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Supprimer Ordi Bob' }))

    expect(screen.getByRole('group', { name: 'Supprimer « Ordi Bob » ?' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.getByText('Ordi Bob')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Supprimer Ordi Bob' }))
    await user.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect(await screen.findByText('Aucun Service')).toBeTruthy()
    expect(screen.queryByText('Ordi Bob')).toBeNull()
  })

  it('edits a Service from its row with the pre-filled form', async () => {
    await openWithOrdi()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Modifier Ordi Bob' }))

    expect(screen.getByRole('form', { name: 'Modifier un Service' })).toBeTruthy()
    expect((screen.getByLabelText('Libellé') as HTMLInputElement).value).toBe('Ordi Bob')
    await user.clear(screen.getByLabelText('Libellé'))
    await user.type(screen.getByLabelText('Libellé'), 'Ordi Neuf')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByText('Ordi Neuf')).toBeTruthy()
    expect(screen.queryByText('Ordi Bob')).toBeNull()
  })
})
