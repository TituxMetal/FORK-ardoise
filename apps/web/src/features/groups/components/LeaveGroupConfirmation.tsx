import { Button } from '~ui'
import type { GroupSummary } from '../types'

type Props = {
  group: GroupSummary
  onConfirm: () => void
  onCancel: () => void
}

export const LeaveGroupConfirmation = ({ group, onConfirm, onCancel }: Props) => (
  <div role="alertdialog" aria-label="Quitter le Groupe" className="flex flex-col gap-3 py-3">
    <p>Quitter « {group.name} » ? Si tu es le dernier Membre, le Groupe sera supprimé.</p>
    <div className="flex gap-2">
      <Button type="button" variant="danger" onClick={onConfirm}>
        Quitter
      </Button>
      <Button type="button" variant="secondary" onClick={onCancel} autoFocus>
        Annuler
      </Button>
    </div>
  </div>
)
