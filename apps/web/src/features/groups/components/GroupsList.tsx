import { useRef } from 'react'
import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import { PencilIcon } from '~/components/icons/PencilIcon'
import { TrashIcon } from '~/components/icons/TrashIcon'
import { Link } from '~/lib/router'
import type { RenameGroupInput } from '../schemas'
import type { GroupSummary } from '../types'
import { LeaveGroupConfirmation } from './LeaveGroupConfirmation'
import { RenameGroupFields } from './RenameGroupFields'

type Props = {
  groups: GroupSummary[]
  renamingId: string | null
  confirmingId: string | null
  renameForm: UseFormReturn<RenameGroupInput>
  renameError: string
  onStartRename: (group: GroupSummary) => void
  onCancelRename: () => void
  onRename: SubmitHandler<RenameGroupInput>
  onStartLeave: (group: GroupSummary) => void
  onCancelLeave: () => void
  onLeave: (group: GroupSummary) => void
}

type RowProps = {
  group: GroupSummary
  renamingId: string | null
  confirmingId: string | null
  renameForm: UseFormReturn<RenameGroupInput>
  renameError: string
  onStartRename: (group: GroupSummary) => void
  onCancelRename: () => void
  onRename: SubmitHandler<RenameGroupInput>
  onStartLeave: (group: GroupSummary) => void
  onCancelLeave: () => void
  onLeave: (group: GroupSummary) => void
}

const GroupRow = ({
  group,
  renamingId,
  confirmingId,
  renameForm,
  renameError,
  onStartRename,
  onCancelRename,
  onRename,
  onStartLeave,
  onCancelLeave,
  onLeave
}: RowProps) => {
  const renameTrigger = useRef<HTMLButtonElement>(null)
  const leaveTrigger = useRef<HTMLButtonElement>(null)

  const cancelRename = () => {
    onCancelRename()
    requestAnimationFrame(() => renameTrigger.current?.focus())
  }

  const cancelLeave = () => {
    onCancelLeave()
    requestAnimationFrame(() => leaveTrigger.current?.focus())
  }

  if (renamingId === group.id) {
    return (
      <RenameGroupFields
        form={renameForm}
        error={renameError}
        onSubmit={onRename}
        onCancel={cancelRename}
      />
    )
  }

  if (confirmingId === group.id) {
    return (
      <LeaveGroupConfirmation
        group={group}
        onConfirm={() => onLeave(group)}
        onCancel={cancelLeave}
      />
    )
  }

  return (
    <div className="flex min-h-11 items-center gap-1">
      <Link
        to={`/groups/${group.id}`}
        className="flex-1 break-words py-3 text-foreground hover:text-dim"
      >
        {group.name}
      </Link>
      <button
        ref={renameTrigger}
        type="button"
        aria-label={`Renommer ${group.name}`}
        onClick={() => onStartRename(group)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-dim hover:bg-surface-2 hover:text-foreground"
      >
        <PencilIcon />
      </button>
      <button
        ref={leaveTrigger}
        type="button"
        aria-label={`Quitter ${group.name}`}
        onClick={() => onStartLeave(group)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-dim hover:bg-surface-2 hover:text-negative"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

export const GroupsList = ({
  groups,
  renamingId,
  confirmingId,
  renameForm,
  renameError,
  onStartRename,
  onCancelRename,
  onRename,
  onStartLeave,
  onCancelLeave,
  onLeave
}: Props) => (
  <div className="space-y-2">
    <h2 className="text-lg font-medium">Mes Groupes</h2>
    <ul className="space-y-1">
      {groups.map(group => (
        <li key={group.id} className="rounded-lg bg-surface px-3">
          <GroupRow
            group={group}
            renamingId={renamingId}
            confirmingId={confirmingId}
            renameForm={renameForm}
            renameError={renameError}
            onStartRename={onStartRename}
            onCancelRename={onCancelRename}
            onRename={onRename}
            onStartLeave={onStartLeave}
            onCancelLeave={onCancelLeave}
            onLeave={onLeave}
          />
        </li>
      ))}
    </ul>
  </div>
)
