/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { applyGroup } from '~features/groups'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { Paybacks } from './Paybacks'

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
  it('lists the Paybacks of the Slate with the creditor direction', async () => {
    await openWithPayback()

    expect(screen.getByText('Bob → Léa 0,20 €')).toBeTruthy()
  })

  it('shows an empty Slate when the Group has no Payback', async () => {
    const client = api.groups(testUsers.lea)
    const group = await client.create('Potes de Bob')
    applyGroup(await client.get(group.id))
    render(<Paybacks client={api.paybacks(testUsers.lea)} />)

    expect(screen.getByText('Aucun Règlement')).toBeTruthy()
  })

  it('lets any Member delete a Payback from the list', async () => {
    await openWithPayback()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Supprimer le Règlement Bob → Léa' }))

    expect(await screen.findByText('Aucun Règlement')).toBeTruthy()
    expect(screen.queryByText('Bob → Léa 0,20 €')).toBeNull()
  })
})
