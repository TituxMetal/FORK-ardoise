/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
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

const renameTo = async (from: string, to: string) => {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: `Renommer ${from}` }))
  const form = screen.getByRole('form', { name: 'Renommer le Groupe' })
  const input = within(form).getByLabelText('Nom')
  await user.clear(input)
  await user.type(input, to)
  await user.click(within(form).getByRole('button', { name: 'Enregistrer' }))
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

  it('shows the API message when the creation fails', async () => {
    render(
      <GroupsPage
        client={{
          ...api.groups(testUsers.lea),
          create: async () => {
            throw new Error('Groupe introuvable')
          }
        }}
      />
    )

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nom'), 'Potes de Bob')
    await user.click(screen.getByRole('button', { name: 'Créer le Groupe' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Groupe introuvable')
  })

  it('opens a Group on its own route', async () => {
    const client = api.groups(testUsers.lea)
    render(<GroupsPage client={client} />)

    await createNamed('Potes de Bob')
    await userEvent.click(await screen.findByRole('link', { name: 'Potes de Bob' }))

    const [group] = await client.list()
    expect(window.location.pathname).toBe(`/groups/${group.id}`)
  })

  it('renames a Group in the list', async () => {
    render(<GroupsPage client={api.groups(testUsers.lea)} />)

    await createNamed('Potes de Bob')
    await renameTo('Potes de Bob', 'Soirée de Bob')

    expect(await screen.findByRole('link', { name: 'Soirée de Bob' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Potes de Bob' })).toBeNull()
  })

  it('cancels a rename and keeps the previous name', async () => {
    render(<GroupsPage client={api.groups(testUsers.lea)} />)

    await createNamed('Potes de Bob')
    await userEvent.click(screen.getByRole('button', { name: 'Renommer Potes de Bob' }))
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(screen.getByRole('link', { name: 'Potes de Bob' })).toBeTruthy()
  })

  it('rejects an empty rename with a French message', async () => {
    render(<GroupsPage client={api.groups(testUsers.lea)} />)

    await createNamed('Potes de Bob')
    await userEvent.click(screen.getByRole('button', { name: 'Renommer Potes de Bob' }))

    const form = screen.getByRole('form', { name: 'Renommer le Groupe' })
    const input = within(form).getByLabelText('Nom')
    await userEvent.clear(input)
    await userEvent.click(within(form).getByRole('button', { name: 'Enregistrer' }))

    expect((await within(form).findByRole('alert')).textContent).toBe('Nom du Groupe requis')
  })

  it('shows the API message when the rename fails', async () => {
    render(
      <GroupsPage
        client={{
          ...api.groups(testUsers.lea),
          rename: async () => {
            throw new Error('Groupe introuvable')
          }
        }}
      />
    )

    await createNamed('Potes de Bob')
    await userEvent.click(screen.getByRole('button', { name: 'Renommer Potes de Bob' }))

    const form = screen.getByRole('form', { name: 'Renommer le Groupe' })
    const input = within(form).getByLabelText('Nom')
    await userEvent.clear(input)
    await userEvent.type(input, 'Soirée')
    await userEvent.click(within(form).getByRole('button', { name: 'Enregistrer' }))

    expect((await within(form).findByRole('alert')).textContent).toBe('Groupe introuvable')
  })

  it('leaves a Group behind a destructive confirmation', async () => {
    const client = api.groups(testUsers.lea)
    render(<GroupsPage client={client} />)

    await createNamed('Potes de Bob')
    await userEvent.click(screen.getByRole('button', { name: 'Quitter Potes de Bob' }))

    expect(screen.getByRole('group', { name: 'Quitter le Groupe' })).toBeTruthy()
    expect(screen.getByText(/Quitter « Potes de Bob »/)).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Quitter' }))

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Potes de Bob' })).toBeNull()
    })
    expect(await client.list()).toEqual([])
  })

  it('keeps the Group when the leave confirmation is cancelled', async () => {
    render(<GroupsPage client={api.groups(testUsers.lea)} />)

    await createNamed('Potes de Bob')
    await userEvent.click(screen.getByRole('button', { name: 'Quitter Potes de Bob' }))
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(screen.getByRole('link', { name: 'Potes de Bob' })).toBeTruthy()
  })

  it('shows the API message when leaving fails', async () => {
    render(
      <GroupsPage
        client={{
          ...api.groups(testUsers.lea),
          leave: async () => {
            throw new Error('Impossible de quitter le Groupe')
          }
        }}
      />
    )

    await createNamed('Potes de Bob')
    await userEvent.click(screen.getByRole('button', { name: 'Quitter Potes de Bob' }))
    await userEvent.click(screen.getByRole('button', { name: 'Quitter' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Impossible de quitter le Groupe')
  })
})
