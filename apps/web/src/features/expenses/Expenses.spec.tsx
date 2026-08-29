/** @vitest-environment happy-dom */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { euros } from '~/lib/amounts'
import type { GroupDto } from '~features/groups/client'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { Expenses } from '~features/expenses/Expenses'

afterEach(cleanup)

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const openExpenses = async () => {
  const client = api.client(testUsers.lea)
  const group = await client.create('Potes de Bob')
  await api.client(testUsers.bob).join(group.invite.secret)
  await api.client(testUsers.camille).join(group.invite.secret)
  const joined = await client.get(group.id)
  const Board = () => {
    const [current, setCurrent] = useState<GroupDto>(joined)
    return (
      <>
        <Expenses group={current} client={client} onChange={setCurrent} />
        <ul>
          {current.balances.map(balance => (
            <li key={balance.userId}>
              {balance.name} {euros(balance.amount)}
            </li>
          ))}
        </ul>
      </>
    )
  }
  render(<Board />)
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
