/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { applyGroup, cancelEdit } from '~features/groups'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { Paybacks } from './Paybacks'

afterEach(cleanup)
afterEach(() => cancelEdit())
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
  await api.expenses(testUsers.lea).create(group.id, {
    label: 'Pizza',
    day: '2026-08-15',
    amount: 100,
    payerId: 'lea',
    participantIds: ['lea', 'bob']
  })
  await api.paybacks(testUsers.lea).create(group.id, {
    debtorId: 'bob',
    creditorId: 'lea',
    amount: 20
  })
  applyGroup(await client.get(group.id))
  render(<Paybacks client={api.paybacks(testUsers.lea)} />)
}

describe('Paybacks', () => {
  it('lists the Paybacks of the Slate as shared rows with the creditor direction', async () => {
    await openWithPayback()

    expect(screen.getByText('BO')).toBeTruthy()
    expect(screen.getByText('Bob → Léa')).toBeTruthy()
    expect(screen.getByText('0,20 €')).toBeTruthy()
  })

  it('shows an empty Slate when the Group has no Payback', async () => {
    const client = api.groups(testUsers.lea)
    const group = await client.create('Potes de Bob')
    applyGroup(await client.get(group.id))
    render(<Paybacks client={api.paybacks(testUsers.lea)} />)

    expect(screen.getByText('Aucun Règlement')).toBeTruthy()
  })

  it('deletes a Payback only after the confirmation is confirmed', async () => {
    await openWithPayback()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Supprimer Bob → Léa' }))

    expect(screen.getByRole('group', { name: 'Supprimer « Bob → Léa » ?' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.getByText('Bob → Léa')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Supprimer Bob → Léa' }))
    await user.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect(await screen.findByText('Aucun Règlement')).toBeTruthy()
    expect(screen.queryByText('Bob → Léa')).toBeNull()
  })

  it('edits a Payback from its row with the pre-filled form and the cap without it', async () => {
    await openWithPayback()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Modifier Bob → Léa' }))

    expect(screen.getByRole('form', { name: 'Modifier le Règlement' })).toBeTruthy()
    expect((screen.getByLabelText('Montant') as HTMLInputElement).value).toBe('0,20')
    expect(screen.getByText('Plafond 0,50 €')).toBeTruthy()
    await user.clear(screen.getByLabelText('Montant'))
    await user.type(screen.getByLabelText('Montant'), '0,30')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByText('0,30 €')).toBeTruthy()
    expect(screen.queryByText('0,20 €')).toBeNull()
  })
  it('resets the edit form when switching directly between two Paybacks', async () => {
    const client = api.groups(testUsers.lea)
    const group = await client.create('Potes de Bob')
    await api.groups(testUsers.bob).join(group.invite.secret)
    await api.expenses(testUsers.lea).create(group.id, {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'lea',
      participantIds: ['lea', 'bob']
    })
    await api.paybacks(testUsers.lea).create(group.id, {
      debtorId: 'bob',
      creditorId: 'lea',
      amount: 20
    })
    await api.paybacks(testUsers.lea).create(group.id, {
      debtorId: 'bob',
      creditorId: 'lea',
      amount: 30
    })
    applyGroup(await client.get(group.id))
    render(<Paybacks client={api.paybacks(testUsers.lea)} />)

    const user = userEvent.setup()
    const editButtons = screen.getAllByRole('button', { name: 'Modifier Bob → Léa' })
    await user.click(editButtons[0])
    await user.click(editButtons[1])

    expect((screen.getByLabelText('Montant') as HTMLInputElement).value).toBe('0,30')
  })
})
