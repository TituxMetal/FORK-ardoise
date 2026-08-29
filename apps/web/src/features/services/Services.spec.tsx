/** @vitest-environment happy-dom */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { euros } from '~/lib/amounts'
import { Expenses } from '~features/expenses/Expenses'
import type { GroupDto } from '~features/groups/api/groups.client'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { Services } from '~features/services/Services'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const openServices = async () => {
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
        <Services group={current} client={client} onChange={setCurrent} />
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

describe('Services', () => {
  it('records a Service, lists it apart from Expenses and updates Balances', async () => {
    await openServices()

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater un Service' })
    await user.type(within(form).getByLabelText('Libellé'), 'Ordi Bob')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '1')
    await user.selectOptions(within(form).getByLabelText('Prestataire'), 'lea')
    await user.click(screen.getByRole('button', { name: 'Constater le Service' }))

    expect(await screen.findByText('Ordi Bob')).toBeTruthy()
    expect(screen.getByText('Aucune Dépense')).toBeTruthy()
    expect(screen.getByText('Léa 0,66 €')).toBeTruthy()
    expect(screen.getByText('Bob −0,33 €')).toBeTruthy()
    expect(screen.getByText('Camille −0,33 €')).toBeTruthy()
  })

  it('lets any Member delete a Service from the list', async () => {
    await openServices()

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater un Service' })
    await user.type(within(form).getByLabelText('Libellé'), 'Ordi Bob')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '1')
    await user.selectOptions(within(form).getByLabelText('Prestataire'), 'lea')
    await user.click(screen.getByRole('button', { name: 'Constater le Service' }))
    await user.click(await screen.findByRole('button', { name: 'Supprimer Ordi Bob' }))

    expect(await screen.findByText('Aucun Service')).toBeTruthy()
    expect(screen.getByText('Léa 0,00 €')).toBeTruthy()
  })
})
