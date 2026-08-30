import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { Alert, EntryRow } from '~ui'
import { euros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { dayLabel, initials } from '~/lib/format'
import { $editing, $group, applyGroup, cancelEdit, startEdit } from '~features/groups'
import { servicesClient } from '../api'
import type { ServicesClient } from '../types'
import { EditServiceForm } from './EditServiceForm'

type Props = {
  client?: ServicesClient
}

export const Services = ({ client = servicesClient }: Props) => {
  const group = useStore($group)
  const editing = useStore($editing)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const deleteService = async (serviceId: string) => {
    if (!group) return
    try {
      applyGroup(await client.delete(group.id, serviceId))
      setError('')
      setConfirmingId(null)
    } catch (error) {
      setError(errorMessage(error, 'Service introuvable'))
    }
  }

  if (!group) return null

  const nameOf = (userId: string) =>
    group.members.find(member => member.userId === userId)?.name ?? userId

  return (
    <>
      {error ? <Alert message={error} /> : null}
      {editing?.kind === 'services' ? (
        <EditServiceForm serviceId={editing.id} client={client} onCancel={cancelEdit} />
      ) : null}
      {group.services.length === 0 ? (
        <p>Aucun Service</p>
      ) : (
        <ul className="space-y-2">
          {group.services.map(service => (
            <EntryRow
              key={service.id}
              initials={initials(nameOf(service.providerId))}
              label={service.label}
              detail={`${nameOf(service.providerId)} · ${dayLabel(service.day)}`}
              amount={euros(service.amount)}
              onEdit={() => {
                setConfirmingId(null)
                startEdit({ kind: 'services', id: service.id })
              }}
              onRequestDelete={() => setConfirmingId(service.id)}
              confirming={confirmingId === service.id}
              confirmLabel={`Supprimer « ${service.label} » ?`}
              onConfirm={() => void deleteService(service.id)}
              onCancel={() => setConfirmingId(null)}
            />
          ))}
        </ul>
      )}
    </>
  )
}
