/** @vitest-environment happy-dom */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useStore } from '@nanostores/react'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { euros } from '~/lib/amounts'
import { $group, applyGroup } from '~features/groups'
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

const Balances = () => {
  const group = useStore($group)
  return (
    <ul>
      {group?.balances.map(balance => (
        <li key={balance.userId}>
          {balance.name} {euros(balance.amount)}
        </li>
      ))}
    </ul>
  )
}

const openExpenses = async () => {
  const client = api.groups(testUsers.lea)
  const group = await client.create('Potes de Bob')
  await api.groups(testUsers.bob).join(group.invite.secret)
  await api.groups(testUsers.camille).join(group.invite.secret)
  applyGroup(await client.get(group.id))
  render(
    <>
      <Expenses client={api.expenses(testUsers.lea)} />
      <Balances />
    </>
  )
}

describe('Expenses', () => {
  it('records an Expense, lists it and updates Balances', async () => {
    await openExpenses()

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater une Dépense' })
    await user.type(within(form).getByLabelText('Libellé'), 'Pizza')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '1')
    await user.selectOptions(within(form).getByLabelText('Payeur'), 'lea')
    await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))

    expect(await screen.findByText('Pizza')).toBeTruthy()
    expect(screen.getByText('2026-08-15')).toBeTruthy()
    expect(screen.getByText('Léa 0,66 €')).toBeTruthy()
    expect(screen.getByText('Bob −0,33 €')).toBeTruthy()
    expect(screen.getByText('Camille −0,33 €')).toBeTruthy()
  })

  it('lets any Member delete an Expense from the list', async () => {
    await openExpenses()

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater une Dépense' })
    await user.type(within(form).getByLabelText('Libellé'), 'Pizza')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '1')
    await user.selectOptions(within(form).getByLabelText('Payeur'), 'lea')
    await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))
    await user.click(await screen.findByRole('button', { name: 'Supprimer Pizza' }))

    expect(await screen.findByText('Aucune Dépense')).toBeTruthy()
    expect(screen.getByText('Léa 0,00 €')).toBeTruthy()
  })
})
