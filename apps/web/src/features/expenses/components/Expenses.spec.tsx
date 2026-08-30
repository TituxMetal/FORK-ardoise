/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { applyGroup } from '~features/groups'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { Expenses } from './Expenses'

afterEach(cleanup)
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
  it('lists the Expenses of the Slate', async () => {
    await openWithPizza()

    expect(screen.getByText('Pizza')).toBeTruthy()
    expect(screen.getByText('2026-08-15')).toBeTruthy()
    expect(screen.getByText('1,00 €')).toBeTruthy()
  })

  it('shows an empty Slate when the Group has no Expense', async () => {
    const client = api.groups(testUsers.lea)
    const group = await client.create('Potes de Bob')
    applyGroup(await client.get(group.id))
    render(<Expenses client={api.expenses(testUsers.lea)} />)

    expect(screen.getByText('Aucune Dépense')).toBeTruthy()
  })

  it('lets any Member delete an Expense from the list', async () => {
    await openWithPizza()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Supprimer Pizza' }))

    expect(await screen.findByText('Aucune Dépense')).toBeTruthy()
    expect(screen.queryByText('Pizza')).toBeNull()
  })
})
