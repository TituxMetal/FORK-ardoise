/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { EntryRow } from './EntryRow'
import { useState } from 'react'

afterEach(cleanup)

const row = (overrides: Partial<Parameters<typeof EntryRow>[0]> = {}) => ({
  initials: 'PI',
  label: 'Pizza',
  detail: 'Léa · 15 août',
  amount: '1,00 €',
  onEdit: () => {},
  onRequestDelete: () => {},
  confirming: false,
  confirmLabel: 'Supprimer « Pizza » ?',
  onConfirm: () => {},
  onCancel: () => {},
  ...overrides
})

describe('EntryRow', () => {
  it('renders the initials, label, author · date and amount of an entry', () => {
    render(<EntryRow {...row()} />)

    expect(screen.getByText('PI')).toBeTruthy()
    expect(screen.getByText('Pizza')).toBeTruthy()
    expect(screen.getByText('Léa · 15 août')).toBeTruthy()
    expect(screen.getByText('1,00 €')).toBeTruthy()
  })

  it('announces the edit and delete actions by entry label', async () => {
    const onEdit = vi.fn()
    const onRequestDelete = vi.fn()
    render(<EntryRow {...row({ onEdit, onRequestDelete })} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Modifier Pizza' }))
    await user.click(screen.getByRole('button', { name: 'Supprimer Pizza' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onRequestDelete).toHaveBeenCalledTimes(1)
  })

  it('swaps the row for a confirmation that deletes or cancels', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const { rerender } = render(<EntryRow {...row()} />)

    rerender(<EntryRow {...row({ confirming: true, onConfirm, onCancel })} />)

    const group = screen.getByRole('group', { name: 'Supprimer « Pizza » ?' })
    expect(group).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Modifier Pizza' })).toBeNull()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('omits the detail line when the entry kind has none', () => {
    render(<EntryRow {...row({ detail: undefined })} />)

    expect(screen.getByText('Pizza')).toBeTruthy()
    expect(screen.queryByText('Léa · 15 août')).toBeNull()
  })
  it('restores focus to the delete trigger when the confirmation is cancelled', async () => {
    const ConfirmingRow = () => {
      const [confirming, setConfirming] = useState(false)
      return (
        <EntryRow
          {...row({
            confirming,
            onRequestDelete: () => setConfirming(true),
            onCancel: () => setConfirming(false)
          })}
        />
      )
    }
    render(<ConfirmingRow />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Supprimer Pizza' }))
    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Supprimer Pizza' })).toBe(document.activeElement)
    })
  })
})
