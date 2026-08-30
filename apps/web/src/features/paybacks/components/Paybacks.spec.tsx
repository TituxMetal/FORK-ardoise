/** @vitest-environment happy-dom */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { applyGroup } from '~features/groups'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { Expenses } from '~features/expenses'
import { Services } from '~features/services'
import { Paybacks } from './Paybacks'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const openPaybacks = async () => {
  const client = api.groups(testUsers.lea)
  const group = await client.create('Potes de Bob')
  await api.groups(testUsers.bob).join(group.invite.secret)
  await api.groups(testUsers.camille).join(group.invite.secret)
  applyGroup(await client.get(group.id))
  render(
    <>
      <Expenses client={api.expenses(testUsers.lea)} />
      <Services client={api.services(testUsers.lea)} />
      <Paybacks client={api.paybacks(testUsers.lea)} />
    </>
  )
}

const recordPizza = async () => {
  const user = userEvent.setup()
  const form = screen.getByRole('form', { name: 'Constater une Dépense' })
  await user.type(within(form).getByLabelText('Libellé'), 'Pizza')
  await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
  await user.type(within(form).getByLabelText('Montant'), '1')
  await user.selectOptions(within(form).getByLabelText('Payeur'), 'lea')
  await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))
}

describe('Paybacks', () => {
  it('lists strictly positive Balances descending in who owes what and shows the cap', async () => {
    await openPaybacks()
    await recordPizza()

    expect(await screen.findByRole('heading', { name: 'Qui doit quoi' })).toBeTruthy()
    const form = screen.getByRole('form', { name: 'Constater un Règlement' })
    const creditors = within(form).getByLabelText('Créancier')
    expect([...creditors.querySelectorAll('option')].map(option => option.textContent)).toEqual([
      'Léa'
    ])
    expect(within(form).getByText('Plafond 0,33 €')).toBeTruthy()
  })

  it('records a Payback from the chosen creditor', async () => {
    await openPaybacks()
    await recordPizza()

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater un Règlement' })
    await user.selectOptions(within(form).getByLabelText('Débiteur'), 'bob')
    await user.selectOptions(within(form).getByLabelText('Créancier'), 'lea')
    await user.type(within(form).getByLabelText('Montant'), '0,20')
    await user.click(screen.getByRole('button', { name: 'Constater le Règlement' }))

    expect(await screen.findByText('Bob → Léa 0,20 €')).toBeTruthy()
    expect(screen.getByText('Léa 0,46 €')).toBeTruthy()
    expect(screen.getByText('Bob −0,13 €')).toBeTruthy()
  })

  it('lets any Member delete a Payback from the list', async () => {
    await openPaybacks()
    await recordPizza()

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater un Règlement' })
    await user.selectOptions(within(form).getByLabelText('Débiteur'), 'bob')
    await user.selectOptions(within(form).getByLabelText('Créancier'), 'lea')
    await user.type(within(form).getByLabelText('Montant'), '0,20')
    await user.click(screen.getByRole('button', { name: 'Constater le Règlement' }))
    await user.click(
      await screen.findByRole('button', { name: 'Supprimer le Règlement Bob → Léa' })
    )

    expect(await screen.findByText('Aucun Règlement')).toBeTruthy()
    expect(screen.getByText('Léa 0,66 €')).toBeTruthy()
  })

  it('updates the displayed cap when the debtor or the creditor changes', async () => {
    await openPaybacks()
    await recordPizza()

    const user = userEvent.setup()
    const service = screen.getByRole('form', { name: 'Constater un Service' })
    await user.type(within(service).getByLabelText('Libellé'), 'Ordi Bob')
    await user.type(within(service).getByLabelText('Jour'), '2026-08-16')
    await user.type(within(service).getByLabelText('Montant'), '0.90')
    await user.selectOptions(within(service).getByLabelText('Prestataire'), 'bob')
    await user.click(screen.getByRole('button', { name: 'Constater le Service' }))

    const form = screen.getByRole('form', { name: 'Constater un Règlement' })
    const creditors = within(form).getByLabelText('Créancier')
    expect([...creditors.querySelectorAll('option')].map(option => option.textContent)).toEqual([
      'Léa',
      'Bob'
    ])
    expect(within(form).getByText('Plafond 0,36 €')).toBeTruthy()

    await user.selectOptions(within(form).getByLabelText('Créancier'), 'bob')
    expect(within(form).getByText('Plafond 0,27 €')).toBeTruthy()
  })
})
