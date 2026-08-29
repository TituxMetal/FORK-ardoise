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
  const client = api.client(testUsers.lea)
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
    const client = api.client(testUsers.lea)
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

    expect(written).toEqual([`${window.location.origin}/invites/${group.invite.secret}`])
  })

  it('shows an error without a loading fallback when the Group cannot load', async () => {
    render(<GroupPage id="missing" client={api.client(testUsers.lea)} />)

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Groupe introuvable')
    })
    expect(screen.queryByText('Chargement…')).toBeNull()
  })

  it('loads the new Group when the id changes', async () => {
    const client = api.client(testUsers.lea)
    const first = await client.create('Potes de Bob')
    const second = await client.create('Collègues')
    const { rerender } = render(<GroupPage id={first.id} client={client} />)
    await screen.findByRole('heading', { name: 'Potes de Bob' })

    rerender(<GroupPage id={second.id} client={client} />)
    expect(screen.queryByRole('heading', { name: 'Potes de Bob' })).toBeNull()
    expect(await screen.findByRole('heading', { name: 'Collègues' })).toBeTruthy()
  })
})
