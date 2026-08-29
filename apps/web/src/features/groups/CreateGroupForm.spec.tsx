/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { CreateGroupForm } from '~features/groups/CreateGroupForm'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

describe('CreateGroupForm', () => {
  it('creates a Group and notifies the parent', async () => {
    const created: string[] = []
    render(
      <CreateGroupForm
        client={api.client(testUsers.lea)}
        onCreated={() => {
          created.push('created')
        }}
      />
    )

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nom'), 'Potes de Bob')
    await user.click(screen.getByRole('button', { name: 'Créer le Groupe' }))

    await waitFor(() => {
      expect(created).toEqual(['created'])
    })
    const [group] = await api.client(testUsers.lea).list()
    expect(group.name).toBe('Potes de Bob')
  })

  it('shows the API message when the creation fails', async () => {
    const client = {
      ...api.client(testUsers.lea),
      create: async () => {
        throw new Error('Groupe introuvable')
      }
    }
    render(<CreateGroupForm client={client} onCreated={() => {}} />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nom'), 'Potes de Bob')
    await user.click(screen.getByRole('button', { name: 'Créer le Groupe' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Groupe introuvable')
  })
})
