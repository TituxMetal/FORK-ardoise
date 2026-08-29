/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { GroupsPage } from '~/pages/GroupsPage'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const createNamed = async (name: string) => {
  const user = userEvent.setup()
  const input = screen.getByLabelText('Nom')
  await user.clear(input)
  await user.type(input, name)
  await user.click(screen.getByRole('button', { name: 'Créer le Groupe' }))
}

describe('GroupsPage', () => {
  it('creates a Group and lists it', async () => {
    render(<GroupsPage client={api.groups(testUsers.lea)} />)

    await createNamed('Potes de Bob')

    expect(await screen.findByRole('link', { name: 'Potes de Bob' })).toBeTruthy()
  })

  it('keeps two Groups created by the same User on two distinct lines', async () => {
    render(<GroupsPage client={api.groups(testUsers.lea)} />)

    await createNamed('Potes de Bob')
    await createNamed('Collègues')

    expect(
      (await screen.findAllByRole('link', { name: /Potes de Bob|Collègues/ })).map(
        link => link.textContent
      )
    ).toEqual(['Potes de Bob', 'Collègues'])
  })

  it('shows an error instead of throwing when the list fails', async () => {
    render(
      <GroupsPage
        client={{
          ...api.groups(testUsers.lea),
          list: async () => {
            throw new Error('Groupe introuvable')
          }
        }}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Impossible de lister les Groupes')
    })
  })

  it('opens a Group on its own route', async () => {
    const client = api.groups(testUsers.lea)
    render(<GroupsPage client={client} />)

    await createNamed('Potes de Bob')
    await userEvent.click(await screen.findByRole('link', { name: 'Potes de Bob' }))

    const [group] = await client.list()
    expect(window.location.pathname).toBe(`/groups/${group.id}`)
  })
})
