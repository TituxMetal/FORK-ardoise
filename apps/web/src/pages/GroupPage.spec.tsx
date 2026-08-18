/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { createMemoryClient } from '../features/groups/memoryClient.ts'
import { GroupPage } from './GroupPage.tsx'

afterEach(cleanup)

const openGroup = async () => {
  const client = createMemoryClient()
  const group = await client.create('Potes de Bob')
  render(<GroupPage id={group.id} client={client} />)
  await screen.findByRole('heading', { name: 'Potes de Bob' })
}

describe('GroupPage', () => {
  it('opens an empty board', async () => {
    await openGroup()

    expect(screen.getByText('Aucune Dépense')).toBeTruthy()
    expect(screen.getByText('Aucun Service')).toBeTruthy()
    expect(screen.getByText('Aucun Règlement')).toBeTruthy()
    expect(screen.getByText('Léa 0,00 €')).toBeTruthy()
  })

  it('lets a Member copy the Invite link of the opened Group', async () => {
    const written: string[] = []
    const client = createMemoryClient()
    const group = await client.create('Potes de Bob')
    render(
      <GroupPage
        id={group.id}
        client={client}
        copy={async text => {
          written.push(text)
        }}
      />
    )
    await screen.findByRole('heading', { name: 'Potes de Bob' })

    await userEvent.click(screen.getByRole('button', { name: 'Copier le lien d’Invitation' }))

    expect(written).toEqual([`${window.location.origin}/invites/invite-secret`])
  })

  const recordPizza = async () => {
    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater une Dépense' })
    await user.type(within(form).getByLabelText('Libellé'), 'Pizza')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '1')
    await user.selectOptions(within(form).getByLabelText('Payeur'), 'lea')
    await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))
  }

  it('lists strictly positive Balances descending in who owes what and shows the cap', async () => {
    await openGroup()
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
    await openGroup()
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
    await openGroup()
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
    await openGroup()
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

  it('shows an error without a loading fallback when the Group cannot load', async () => {
    const client = createMemoryClient()
    render(
      <GroupPage
        id="missing"
        client={{
          ...client,
          get: async () => {
            throw new Error('Groupe introuvable')
          }
        }}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Groupe introuvable')
    })
    expect(screen.queryByText('Chargement…')).toBeNull()
  })

  it('loads the new Group when the id changes', async () => {
    const client = createMemoryClient()
    const first = await client.create('Potes de Bob')
    const second = await client.create('Collègues')
    const { rerender } = render(<GroupPage id={first.id} client={client} />)
    await screen.findByRole('heading', { name: 'Potes de Bob' })

    rerender(<GroupPage id={second.id} client={client} />)
    expect(screen.queryByRole('heading', { name: 'Potes de Bob' })).toBeNull()
    expect(await screen.findByRole('heading', { name: 'Collègues' })).toBeTruthy()
  })
})
