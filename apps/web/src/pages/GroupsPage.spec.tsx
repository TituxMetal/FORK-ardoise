/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { createMemoryClient } from '~features/groups/memoryClient'
import { GroupsPage } from '~/pages/GroupsPage'

afterEach(cleanup)

const createNamed = async (name: string) => {
  const user = userEvent.setup()
  const input = screen.getByLabelText('Nom')
  await user.clear(input)
  await user.type(input, name)
  await user.click(screen.getByRole('button', { name: 'Créer le Groupe' }))
}

describe('GroupsPage', () => {
  it('creates a Group and lists it', async () => {
    const client = createMemoryClient()
    render(<GroupsPage client={client} />)

    await createNamed('Potes de Bob')

    expect(await screen.findByRole('link', { name: 'Potes de Bob' })).toBeTruthy()
  })

  it('keeps two Groups created by the same User on two distinct lines', async () => {
    render(<GroupsPage client={createMemoryClient()} />)

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
          ...createMemoryClient(),
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
    const client = createMemoryClient()
    render(<GroupsPage client={client} />)

    await createNamed('Potes de Bob')
    await userEvent.click(await screen.findByRole('link', { name: 'Potes de Bob' }))

    const [group] = await client.list()
    expect(window.location.pathname).toBe(`/groups/${group.id}`)
  })
})
