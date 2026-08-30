/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import type { GroupSummary } from '../types'
import { LeaveGroupConfirmation } from './LeaveGroupConfirmation'

afterEach(cleanup)

const group: GroupSummary = { id: 'g1', name: 'Potes de Bob' }

describe('LeaveGroupConfirmation', () => {
  it('asks for confirmation with the Group name and the deletion rule', () => {
    render(<LeaveGroupConfirmation group={group} onConfirm={() => {}} onCancel={() => {}} />)

    expect(screen.getByRole('group', { name: 'Quitter le Groupe' })).toBeTruthy()
    expect(screen.getByText(/Quitter « Potes de Bob »/)).toBeTruthy()
    expect(screen.getByText(/dernier Membre/)).toBeTruthy()
  })

  it('confirms the leave with the danger button', async () => {
    const confirmed: string[] = []
    render(
      <LeaveGroupConfirmation
        group={group}
        onConfirm={() => confirmed.push('confirmed')}
        onCancel={() => {}}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Quitter' }))

    expect(confirmed).toEqual(['confirmed'])
  })

  it('cancels without leaving', async () => {
    const cancelled: string[] = []
    render(
      <LeaveGroupConfirmation
        group={group}
        onConfirm={() => {}}
        onCancel={() => cancelled.push('cancelled')}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(cancelled).toEqual(['cancelled'])
  })
})
