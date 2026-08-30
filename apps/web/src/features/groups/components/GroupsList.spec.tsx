/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { zodResolver } from '@hookform/resolvers/zod'
import { renameGroupSchema, type RenameGroupInput } from '../schemas'
import type { GroupSummary } from '../types'
import { GroupsList } from './GroupsList'

afterEach(cleanup)

const groups: GroupSummary[] = [
  { id: 'g1', name: 'Potes de Bob' },
  { id: 'g2', name: 'Collègues' }
]

type HarnessProps = {
  renamingId?: string | null
  confirmingId?: string | null
  onStartRename?: (group: GroupSummary) => void
  onStartLeave?: (group: GroupSummary) => void
  onRename?: (values: RenameGroupInput) => void
  onCancelRename?: () => void
  onLeave?: (group: GroupSummary) => void
  onCancelLeave?: () => void
}

const Harness = ({
  renamingId = null,
  confirmingId = null,
  onStartRename = () => {},
  onStartLeave = () => {},
  onRename = () => {},
  onCancelRename = () => {},
  onLeave = () => {},
  onCancelLeave = () => {}
}: HarnessProps) => {
  const renameForm = useForm<RenameGroupInput>({
    resolver: zodResolver(renameGroupSchema),
    defaultValues: { name: 'Potes de Bob' }
  })

  return (
    <GroupsList
      groups={groups}
      renamingId={renamingId}
      confirmingId={confirmingId}
      renameForm={renameForm}
      renameError=""
      onStartRename={onStartRename}
      onCancelRename={onCancelRename}
      onRename={onRename}
      onStartLeave={onStartLeave}
      onCancelLeave={onCancelLeave}
      onLeave={onLeave}
    />
  )
}

describe('GroupsList', () => {
  it('renders each Group as a Link with rename and leave actions', () => {
    render(<Harness />)

    const links = screen.getAllByRole('link')
    expect(links.map(link => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Potes de Bob', '/groups/g1'],
      ['Collègues', '/groups/g2']
    ])
    expect(screen.getByRole('button', { name: 'Renommer Potes de Bob' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Quitter Potes de Bob' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Renommer Collègues' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Quitter Collègues' })).toBeTruthy()
  })

  it('reports the Group when rename is requested', async () => {
    const renamed: string[] = []
    render(<Harness onStartRename={group => renamed.push(group.name)} />)

    await userEvent.click(screen.getByRole('button', { name: 'Renommer Potes de Bob' }))

    expect(renamed).toEqual(['Potes de Bob'])
  })

  it('reports the Group when leave is requested', async () => {
    const left: string[] = []
    render(<Harness onStartLeave={group => left.push(group.name)} />)

    await userEvent.click(screen.getByRole('button', { name: 'Quitter Collègues' }))

    expect(left).toEqual(['Collègues'])
  })

  it('shows the rename form for the renaming Group and submits it', async () => {
    const submitted: RenameGroupInput[] = []
    render(<Harness renamingId="g1" onRename={values => submitted.push(values)} />)

    const form = screen.getByRole('form', { name: 'Renommer le Groupe' })
    const name = form.querySelector('input') as HTMLInputElement
    expect(name.value).toBe('Potes de Bob')

    await userEvent.clear(name)
    await userEvent.type(name, 'Soirée de Bob')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => {
      expect(submitted).toEqual([{ name: 'Soirée de Bob' }])
    })
  })

  it('cancels a rename on request', async () => {
    const cancelled: string[] = []
    render(<Harness renamingId="g1" onCancelRename={() => cancelled.push('cancelled')} />)

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(cancelled).toEqual(['cancelled'])
  })

  it('shows the leave confirmation for the leaving Group', async () => {
    render(<Harness confirmingId="g2" />)

    expect(screen.getByRole('alertdialog', { name: 'Quitter le Groupe' })).toBeTruthy()
    expect(screen.getByText(/Quitter « Collègues »/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Potes de Bob' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Collègues' })).toBeNull()
  })

  it('confirms the leave and cancels on request', async () => {
    const left: string[] = []
    const cancelled: string[] = []
    render(
      <Harness
        confirmingId="g2"
        onLeave={group => left.push(group.name)}
        onCancelLeave={() => cancelled.push('cancelled')}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Quitter' }))
    expect(left).toEqual(['Collègues'])

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(cancelled).toEqual(['cancelled'])
  })
})
