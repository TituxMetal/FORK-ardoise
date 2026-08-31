import { useRef, useState, type ReactNode } from 'react'
import { useStore } from '@nanostores/react'
import { Alert, EntryRow } from '~ui'
import { euros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { $editing, $group, applyGroup, cancelEdit, startEdit } from '../store'
import type { Group, SlateTab } from '../types'

export type SlateRowSpec = {
  /** The two-character avatar initials of the entry author. */
  initials: string
  label: string
  /** The « Auteur · date » line; omitted when the entry kind has no date. */
  detail?: string
  /** The entry amount in cents, rendered through `euros`. */
  amount: number
  confirmLabel: string
}

type SlateEntryListProps<TEntry extends { id: string }> = {
  kind: SlateTab
  entries: readonly TEntry[]
  emptyText: string
  notFoundMessage: string
  client: { delete: (groupId: string, entryId: string) => Promise<Group> }
  rowFor: (entry: TEntry) => SlateRowSpec
  renderEditForm: (entryId: string, onCancel: () => void) => ReactNode
}

/**
 * The shared Slate entry list: error banner, the open edit form, and the
 * EntryRow rows with confirmed-delete. A vocabulary adapter (per feature)
 * supplies the entry mapping (`rowFor`) and its edit form, so the three lists
 * are one component here.
 */
export function SlateEntryList<TEntry extends { id: string }>({
  kind,
  entries,
  emptyText,
  notFoundMessage,
  client,
  rowFor,
  renderEditForm
}: SlateEntryListProps<TEntry>) {
  const group = useStore($group)
  const editing = useStore($editing)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const editTrigger = useRef<HTMLButtonElement>(null)
  // A callback ref: it must survive canceling (when `editing` clears and React
  // detaches the conditional prop), so ignore the null detach and keep the
  // last mounted trigger for the focus restore.
  const captureEditTrigger = (el: HTMLButtonElement | null) => {
    if (el) editTrigger.current = el
  }

  // Canceling an edit returns focus to the row's edit trigger, matching the
  // create-form focus pattern (GroupPage.cancelForm).
  const cancelEditForm = () => {
    cancelEdit()
    requestAnimationFrame(() => editTrigger.current?.focus())
  }

  const removeEntry = async (entryId: string) => {
    if (!group) return
    try {
      applyGroup(await client.delete(group.id, entryId))
      setError('')
      setConfirmingId(null)
    } catch (error) {
      setError(errorMessage(error, notFoundMessage))
    }
  }

  if (!group) return null

  return (
    <>
      {error ? <Alert message={error} /> : null}
      {editing?.kind === kind ? renderEditForm(editing.id, cancelEditForm) : null}
      {entries.length === 0 ? (
        <p>{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {entries.map(entry => {
            const row = rowFor(entry)
            return (
              <EntryRow
                key={entry.id}
                initials={row.initials}
                label={row.label}
                detail={row.detail}
                amount={euros(row.amount)}
                editRef={
                  editing?.kind === kind && editing.id === entry.id ? captureEditTrigger : undefined
                }
                onEdit={() => {
                  setConfirmingId(null)
                  startEdit({ kind, id: entry.id })
                }}
                onRequestDelete={() => setConfirmingId(entry.id)}
                confirming={confirmingId === entry.id}
                confirmLabel={row.confirmLabel}
                onConfirm={() => void removeEntry(entry.id)}
                onCancel={() => setConfirmingId(null)}
              />
            )
          })}
        </ul>
      )}
    </>
  )
}
