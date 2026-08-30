import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { Alert, EntryRow } from '~ui'
import { euros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { initials } from '~/lib/format'
import { $editing, $group, applyGroup, cancelEdit, startEdit } from '~features/groups'
import { paybacksClient } from '../api'
import type { PaybacksClient } from '../types'
import { EditPaybackForm } from './EditPaybackForm'

type Props = {
  client?: PaybacksClient
}

export const Paybacks = ({ client = paybacksClient }: Props) => {
  const group = useStore($group)
  const editing = useStore($editing)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const deletePayback = async (paybackId: string) => {
    if (!group) return
    try {
      applyGroup(await client.delete(group.id, paybackId))
      setError('')
      setConfirmingId(null)
    } catch (error) {
      setError(errorMessage(error, 'Règlement introuvable'))
    }
  }

  if (!group) return null

  const nameOf = (userId: string) =>
    group.members.find(member => member.userId === userId)?.name ?? userId
  const labelOf = (payback: { debtorId: string; creditorId: string }) =>
    `${nameOf(payback.debtorId)} → ${nameOf(payback.creditorId)}`

  return (
    <>
      {error ? <Alert message={error} /> : null}
      {editing?.kind === 'paybacks' ? (
        <EditPaybackForm paybackId={editing.id} client={client} onCancel={cancelEdit} />
      ) : null}
      {group.paybacks.length === 0 ? (
        <p>Aucun Règlement</p>
      ) : (
        <ul className="space-y-2">
          {group.paybacks.map(payback => (
            <EntryRow
              key={payback.id}
              initials={initials(nameOf(payback.debtorId))}
              label={labelOf(payback)}
              amount={euros(payback.amount)}
              onEdit={() => {
                setConfirmingId(null)
                startEdit({ kind: 'paybacks', id: payback.id })
              }}
              onRequestDelete={() => setConfirmingId(payback.id)}
              confirming={confirmingId === payback.id}
              confirmLabel={`Supprimer « ${labelOf(payback)} » ?`}
              onConfirm={() => void deletePayback(payback.id)}
              onCancel={() => setConfirmingId(null)}
            />
          ))}
        </ul>
      )}
    </>
  )
}
