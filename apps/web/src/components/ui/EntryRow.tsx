import { Button } from './Button'
import { PencilIcon, TrashIcon } from '~/components/icons'

type EntryRowProps = {
  /** The two-character avatar initials of the author. */
  initials: string
  label: string
  /** The « Auteur · date » line; omitted when the entry kind has no date. */
  detail?: string
  amount: string
  onEdit: () => void
  onRequestDelete: () => void
  confirming: boolean
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * The shared Slate entry row (avatar initials, label, author · date, amount)
 * used by the three lists, with edit and confirmed-delete actions.
 */
export const EntryRow = ({
  initials,
  label,
  detail,
  amount,
  onEdit,
  onRequestDelete,
  confirming,
  confirmLabel,
  onConfirm,
  onCancel
}: EntryRowProps) =>
  confirming ? (
    <li className="py-3">
      <div role="group" aria-label={confirmLabel} className="flex flex-col gap-3">
        <p className="font-medium">{confirmLabel}</p>
        <div className="flex gap-2">
          <Button type="button" variant="danger" onClick={onConfirm}>
            Supprimer
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} autoFocus>
            Annuler
          </Button>
        </div>
      </div>
    </li>
  ) : (
    <li className="flex items-center gap-3 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{label}</p>
        {detail ? <p className="truncate text-sm text-dim">{detail}</p> : null}
      </div>
      <span className="shrink-0 font-semibold">{amount}</span>
      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="secondary"
          className="w-11 px-0"
          aria-label={`Modifier ${label}`}
          onClick={onEdit}
        >
          <PencilIcon />
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-11 px-0"
          aria-label={`Supprimer ${label}`}
          onClick={onRequestDelete}
        >
          <TrashIcon />
        </Button>
      </div>
    </li>
  )
