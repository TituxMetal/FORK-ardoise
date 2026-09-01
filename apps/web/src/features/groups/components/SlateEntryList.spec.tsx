/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useStore } from '@nanostores/react'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { applyGroup, cancelEdit, $group } from '../store'
import type { Group } from '../types'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { SlateEntryList, type SlateRowSpec } from './SlateEntryList'

afterEach(cleanup)
afterEach(() => cancelEdit())
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const renderWithGroup = async (overrides?: {
  client?: { delete: (groupId: string, entryId: string) => Promise<Group> }
}) => {
  const client = api.groups(testUsers.lea)
  const group = await client.create('Potes de Bob')
  await api.groups(testUsers.bob).join(group.invite.secret)
  await api.expenses(testUsers.lea).create(group.id, {
    label: 'Pizza',
    day: '2026-08-15',
    amount: 100,
    payerId: 'lea',
    participantIds: ['lea', 'bob']
  })
  applyGroup(await client.get(group.id))
  const rowFor = (expense: { id: string; label: string; amount: number }): SlateRowSpec => ({
    initials: 'PI',
    label: expense.label,
    detail: 'Léa · 15 août',
    amount: expense.amount,
    confirmLabel: `Supprimer « ${expense.label} » ?`
  })
  const expenses = api.expenses(testUsers.lea)
  const Harness = () => {
    const group = useStore($group)
    if (!group) return null
    return (
      <SlateEntryList
        kind="expenses"
        entries={group.expenses}
        emptyText="Aucune Dépense"
        notFoundMessage="Dépense introuvable"
        client={
          overrides?.client ?? { delete: (groupId, entryId) => expenses.delete(groupId, entryId) }
        }
        rowFor={rowFor}
        renderEditForm={entryId => (
          <p key={entryId} data-testid="edit-form">
            edit:{entryId}
          </p>
        )}
      />
    )
  }
  return render(<Harness />)
}

describe('SlateEntryList', () => {
  it('renders each entry as a shared row', async () => {
    await renderWithGroup()

    expect(screen.getByText('Pizza')).toBeTruthy()
    expect(screen.getByText('Léa · 15 août')).toBeTruthy()
    expect(screen.getByText('1,00 €')).toBeTruthy()
  })

  it('shows the empty text when there are no entries', async () => {
    const client = api.groups(testUsers.lea)
    const group = await client.create('Potes de Bob')
    applyGroup(await client.get(group.id))
    render(
      <SlateEntryList
        kind="expenses"
        entries={[]}
        emptyText="Aucune Dépense"
        notFoundMessage="Dépense introuvable"
        client={{ delete: async () => group }}
        rowFor={() => ({ initials: 'PI', label: '', amount: 0, confirmLabel: '' })}
        renderEditForm={() => null}
      />
    )

    expect(screen.getByText('Aucune Dépense')).toBeTruthy()
  })

  it('deletes an entry only after the confirmation is confirmed', async () => {
    await renderWithGroup()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Supprimer Pizza' }))

    expect(screen.getByRole('group', { name: 'Supprimer « Pizza » ?' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.getByText('Pizza')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Supprimer Pizza' }))
    await user.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect(await screen.findByText('Aucune Dépense')).toBeTruthy()
    expect(screen.queryByText('Pizza')).toBeNull()
  })
  it('keeps the entry and shows the fallback when the delete fails', async () => {
    await renderWithGroup({
      client: {
        delete: async () => {
          throw 'gone'
        }
      }
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Supprimer Pizza' }))
    await user.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Dépense introuvable')
    expect(screen.queryByText('Aucune Dépense')).toBeNull()
  })

  it('opens the edit form for the requested entry', async () => {
    await renderWithGroup()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Modifier Pizza' }))

    expect(screen.getByTestId('edit-form').textContent).toContain('edit:')
  })
})
