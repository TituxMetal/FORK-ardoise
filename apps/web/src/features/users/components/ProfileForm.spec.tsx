/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { ProfileForm } from './ProfileForm'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

describe('ProfileForm', () => {
  it('renames the User and notifies the parent with the saved name', async () => {
    const renamed: string[] = []
    render(
      <ProfileForm
        initialName="Léa"
        client={api.users(testUsers.lea)}
        onRenamed={name => {
          renamed.push(name)
        }}
      />
    )

    const user = userEvent.setup()
    const name = screen.getByLabelText('Nom') as HTMLInputElement
    await user.clear(name)
    await user.type(name, '  Léa P.  ')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect((await screen.findByRole('status')).textContent).toBe('Nom modifié')
    expect(renamed).toEqual(['Léa P.'])
    expect(name.value).toBe('Léa P.')
  })

  it('shows the API message when the rename fails', async () => {
    render(
      <ProfileForm
        initialName="Léa"
        client={{
          rename: async () => {
            throw new Error('Session requise')
          }
        }}
      />
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Session requise')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('rejects a blank name with a French message and does not rename', async () => {
    const renamed: string[] = []
    render(
      <ProfileForm
        initialName="Léa"
        client={api.users(testUsers.lea)}
        onRenamed={name => renamed.push(name)}
      />
    )

    const user = userEvent.setup()
    const name = screen.getByLabelText('Nom') as HTMLInputElement
    await user.clear(name)
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Nom requis')
    expect(renamed).toEqual([])
  })
})
