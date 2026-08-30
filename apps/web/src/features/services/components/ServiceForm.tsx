import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { useStore } from '@nanostores/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { centsFromEuros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { $group, applyGroup } from '~features/groups'
import { servicesClient } from '../api'
import { createServiceSchema, type CreateServiceFormInput } from '../schemas'
import type { ServicesClient } from '../types'
import { ServiceFields } from './ServiceFields'

type Props = {
  client?: ServicesClient
}

export const ServiceForm = ({ client = servicesClient }: Props) => {
  const group = useStore($group)
  const [error, setError] = useState('')
  const form = useForm<CreateServiceFormInput>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      label: '',
      day: '',
      amount: '',
      providerId: group?.members[0]?.userId ?? '',
      participantIds: group?.members.map(member => member.userId) ?? []
    }
  })

  const onSubmit: SubmitHandler<CreateServiceFormInput> = async values => {
    if (!group) return
    try {
      applyGroup(
        await client.create(group.id, {
          label: values.label,
          day: values.day,
          amount: centsFromEuros(values.amount),
          providerId: values.providerId,
          participantIds: values.participantIds
        })
      )
      form.reset()
      setError('')
    } catch (error) {
      setError(errorMessage(error, 'Impossible de constater le Service'))
    }
  }

  if (!group) return null

  return <ServiceFields form={form} error={error} onSubmit={onSubmit} members={group.members} />
}
