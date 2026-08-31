import { useStore } from '@nanostores/react'
import { $group, SlateEntryList } from '~features/groups'
import { dayLabel, initials } from '~/lib/format'
import { servicesClient } from '../api'
import type { ServicesClient } from '../types'
import { EditServiceForm } from './EditServiceForm'

type Props = {
  client?: ServicesClient
}

export const Services = ({ client = servicesClient }: Props) => {
  const group = useStore($group)
  if (!group) return null
  const nameOf = (userId: string) =>
    group.members.find(member => member.userId === userId)?.name ?? userId
  return (
    <SlateEntryList
      kind="services"
      entries={group.services}
      emptyText="Aucun Service"
      notFoundMessage="Service introuvable"
      client={client}
      rowFor={service => ({
        initials: initials(nameOf(service.providerId)),
        label: service.label,
        detail: `${nameOf(service.providerId)} · ${dayLabel(service.day)}`,
        amount: service.amount,
        confirmLabel: `Supprimer « ${service.label} » ?`
      })}
      renderEditForm={(entryId, onCancel) => (
        <EditServiceForm key={entryId} serviceId={entryId} client={client} onCancel={onCancel} />
      )}
    />
  )
}
