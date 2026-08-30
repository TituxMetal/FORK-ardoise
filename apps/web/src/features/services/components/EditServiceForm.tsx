import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { useStore } from '@nanostores/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { centsFromEuros, eurosFromCents } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { $group, applyGroup } from '~features/groups'
import { servicesClient } from '../api'
import { createServiceSchema, type CreateServiceFormInput } from '../schemas'
import type { ServicesClient } from '../types'
import { ServiceFields } from './ServiceFields'

type Props = {
  serviceId: string
  client?: ServicesClient
  onCancel?: () => void
}

export const EditServiceForm = ({ serviceId, client = servicesClient, onCancel }: Props) => {
  const group = useStore($group)
  const [error, setError] = useState('')
  const service = group?.services.find(item => item.id === serviceId)
  const form = useForm<CreateServiceFormInput>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: service
      ? {
          label: service.label,
          day: service.day,
          amount: eurosFromCents(service.amount),
          providerId: service.providerId,
          participantIds: service.participantIds
        }
      : { label: '', day: '', amount: '', providerId: '', participantIds: [] }
  })

  const onSubmit: SubmitHandler<CreateServiceFormInput> = async values => {
    if (!group || !service) return
    try {
      applyGroup(
        await client.update(group.id, service.id, {
          label: values.label,
          day: values.day,
          amount: centsFromEuros(values.amount),
          providerId: values.providerId,
          participantIds: values.participantIds
        })
      )
      setError('')
      onCancel?.()
    } catch (error) {
      setError(errorMessage(error, 'Impossible de modifier le Service'))
    }
  }

  if (!group || !service) return null

  return (
    <ServiceFields
      form={form}
      error={error}
      onSubmit={onSubmit}
      members={group.members}
      mode="edit"
      onCancel={() => {
        form.reset()
        onCancel?.()
      }}
    />
  )
}
