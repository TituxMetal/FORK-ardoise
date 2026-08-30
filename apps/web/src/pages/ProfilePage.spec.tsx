/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { ProfilePage } from './ProfilePage'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

describe('ProfilePage', () => {
  it('renames the session User and every Group seat they sit in', async () => {
    const renamed: string[] = []
    const groups = api.groups(testUsers.lea)
    const group = await groups.create('Potes de Bob')
    render(
      <ProfilePage
        session={{ name: 'Léa' }}
        users={api.users(testUsers.lea)}
        onRenamed={name => {
          renamed.push(name)
        }}
      />
    )

    const user = userEvent.setup()
    const name = screen.getByLabelText('Nom') as HTMLInputElement
    await user.clear(name)
    await user.type(name, 'Léa P.')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByRole('status')).toBeTruthy()
    expect(renamed).toEqual(['Léa P.'])
    const updated = await groups.get(group.id)
    expect(updated.members).toEqual([{ userId: 'lea', name: 'Léa P.' }])
  })

  it('shows the API message when the rename fails', async () => {
    render(
      <ProfilePage
        session={{ name: 'Léa' }}
        users={{
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
})
