/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { applyGroup, cancelEdit } from '~features/groups'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { Expenses } from './Expenses'

afterEach(cleanup)
afterEach(() => cancelEdit())
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const openWithPizza = async () => {
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
  applyGroup(await client.get(group.id))
  render(<Expenses client={api.expenses(testUsers.lea)} />)
}

describe('Expenses', () => {
  it('lists the Expenses of the Slate as shared rows', async () => {
    await openWithPizza()

    expect(screen.getByText('LÉ')).toBeTruthy()
    expect(screen.getByText('Pizza')).toBeTruthy()
    expect(screen.getByText('Léa · 15 août')).toBeTruthy()
    expect(screen.getByText('1,00 €')).toBeTruthy()
  })

  it('shows an empty Slate when the Group has no Expense', async () => {
    const client = api.groups(testUsers.lea)
    const group = await client.create('Potes de Bob')
    applyGroup(await client.get(group.id))
    render(<Expenses client={api.expenses(testUsers.lea)} />)

    expect(screen.getByText('Aucune Dépense')).toBeTruthy()
  })

  it('deletes an Expense only after the confirmation is confirmed', async () => {
    await openWithPizza()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Supprimer Pizza' }))

    expect(screen.getByRole('group', { name: 'Supprimer « Pizza » ?' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.getByText('Pizza')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Supprimer Pizza' }))
    await user.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect(await screen.findByText('Aucune Dépense')).toBeTruthy()
    expect(screen.queryByText('Pizza')).toBeNull()
  })

  it('edits an Expense from its row with the pre-filled form', async () => {
    await openWithPizza()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Modifier Pizza' }))

    const form = screen.getByRole('form', { name: 'Modifier une Dépense' })
    expect(form).toBeTruthy()
    expect((screen.getByLabelText('Libellé') as HTMLInputElement).value).toBe('Pizza')
    expect((screen.getByLabelText('Jour') as HTMLInputElement).value).toBe('2026-08-15')
    expect((screen.getByLabelText('Montant') as HTMLInputElement).value).toBe('1,00')
    await user.clear(screen.getByLabelText('Libellé'))
    await user.type(screen.getByLabelText('Libellé'), 'Pizza géante')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByText('Pizza géante')).toBeTruthy()
    expect(screen.queryByText('Pizza')).toBeNull()
  })
})
