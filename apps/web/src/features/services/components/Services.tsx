import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { Alert, Button } from '~ui'
import { euros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { $group, applyGroup } from '~features/groups'
import { servicesClient } from '../api'
import type { ServicesClient } from '../types'
import { ServiceForm } from './ServiceForm'

type Props = {
  client?: ServicesClient
}

export const Services = ({ client = servicesClient }: Props) => {
  const group = useStore($group)
  const [error, setError] = useState('')

  const deleteService = async (serviceId: string) => {
    if (!group) return
    try {
      applyGroup(await client.delete(group.id, serviceId))
      setError('')
    } catch (error) {
      setError(errorMessage(error, 'Service introuvable'))
    }
  }

  if (!group) return null

  return (
    <>
      {error ? <Alert message={error} /> : null}
      <ServiceForm client={client} />
      {group.services.length === 0 ? (
        <p>Aucun Service</p>
      ) : (
        <ul className="space-y-2">
          {group.services.map(service => (
            <li key={service.id} className="space-y-1">
              <p>{service.label}</p>
              <p>{service.day}</p>
              <p>{euros(service.amount)}</p>
              <Button
                variant="secondary"
                type="button"
                onClick={() => void deleteService(service.id)}
              >
                Supprimer {service.label}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
