/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { GroupPage } from '~/pages/GroupPage'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const openGroup = async () => {
  const client = api.groups(testUsers.lea)
  const group = await client.create('Potes de Bob')
  render(
    <GroupPage
      id={group.id}
      groups={client}
      expenses={api.expenses(testUsers.lea)}
      services={api.services(testUsers.lea)}
      paybacks={api.paybacks(testUsers.lea)}
    />
  )
  await screen.findByRole('heading', { name: 'Potes de Bob' })
  return group
}

describe('GroupPage', () => {
  it('opens the empty Slate on the Dépenses tab with a balance hero and self chip', async () => {
    await openGroup()

    expect(screen.getByText('On te doit 0,00 €')).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Aucune Dépense')).toBeTruthy()
    expect(screen.queryByText('Aucun Service')).toBeNull()
    expect(screen.queryByText('Aucun Règlement')).toBeNull()
    expect(screen.queryByRole('tabpanel', { name: 'Services' })).toBeNull()
    expect(screen.queryByRole('tabpanel', { name: 'Remboursements' })).toBeNull()
  })

  it('switches the Slate between the three tabs', async () => {
    await openGroup()

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'Services' }))
    expect(screen.getByRole('tabpanel', { name: 'Services' })).toBeTruthy()
    expect(screen.getByText('Aucun Service')).toBeTruthy()
    expect(screen.queryByText('Aucune Dépense')).toBeNull()

    await user.click(screen.getByRole('tab', { name: 'Remboursements' }))
    expect(screen.getByRole('tabpanel', { name: 'Remboursements' })).toBeTruthy()
    expect(screen.getByText('Aucun Règlement')).toBeTruthy()
    expect(screen.queryByText('Aucun Service')).toBeNull()
  })

  it('lets the + open the create form of the active tab and closes it on tab change', async () => {
    await openGroup()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Ajouter une Dépense' }))
    expect(screen.getByRole('form', { name: 'Constater une Dépense' })).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Services' }))
    expect(screen.queryByRole('form', { name: 'Constater une Dépense' })).toBeNull()
    expect(screen.getByText('Aucun Service')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Ajouter un Service' }))
    expect(screen.getByRole('form', { name: 'Constater un Service' })).toBeTruthy()
  })

  it('keeps an open create form when the active tab is re-clicked', async () => {
    await openGroup()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Ajouter une Dépense' }))
    expect(screen.getByRole('form', { name: 'Constater une Dépense' })).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Dépenses' }))
    expect(screen.getByRole('form', { name: 'Constater une Dépense' })).toBeTruthy()
  })

  it('closes an open create form with Annuler', async () => {
    await openGroup()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Ajouter une Dépense' }))
    expect(screen.getByRole('form', { name: 'Constater une Dépense' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('form', { name: 'Constater une Dépense' })).toBeNull()
  })

  it('lets a Member copy the Invite link of the opened Group', async () => {
    const written: string[] = []
    const client = api.groups(testUsers.lea)
    const group = await client.create('Potes de Bob')
    render(
      <GroupPage
        id={group.id}
        groups={client}
        copy={async text => {
          written.push(text)
        }}
      />
    )
    await screen.findByRole('heading', { name: 'Potes de Bob' })

    await userEvent.click(screen.getByRole('button', { name: 'Copier le lien d’Invitation' }))

    expect(written).toEqual([`${window.location.origin}/invites/${group.invite.secret}`])
  })

  it('shows an error without a loading fallback when the Group cannot load', async () => {
    render(<GroupPage id="missing" groups={api.groups(testUsers.lea)} />)

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Groupe introuvable')
    })
    expect(screen.queryByText('Chargement…')).toBeNull()
  })

  it('loads the new Group when the id changes', async () => {
    const client = api.groups(testUsers.lea)
    const first = await client.create('Potes de Bob')
    const second = await client.create('Collègues')
    const { rerender } = render(<GroupPage id={first.id} groups={client} />)
    await screen.findByRole('heading', { name: 'Potes de Bob' })

    rerender(<GroupPage id={second.id} groups={client} />)
    expect(screen.queryByRole('heading', { name: 'Potes de Bob' })).toBeNull()
    expect(await screen.findByRole('heading', { name: 'Collègues' })).toBeTruthy()
  })

  it('refreshes the Slate when the window regains focus', async () => {
    const client = api.groups(testUsers.lea)
    const group = await client.create('Potes de Bob')
    render(<GroupPage id={group.id} groups={client} />)
    await screen.findByRole('heading', { name: 'Potes de Bob' })
    expect(screen.getByText('Aucune Dépense')).toBeTruthy()

    await api.groups(testUsers.bob).join(group.invite.secret)
    await api.expenses(testUsers.lea).create(group.id, {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'lea'
    })

    window.dispatchEvent(new Event('focus'))

    expect(await screen.findByText('Pizza')).toBeTruthy()
  })
})
