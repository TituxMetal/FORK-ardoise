import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { errorMessage } from '~/lib/errorMessage'
import { groupsClient } from '../api'
import { createGroupSchema, type CreateGroupInput } from '../schemas'
import type { GroupsClient } from '../types'
import { CreateGroupFields } from './CreateGroupFields'

type Props = {
  client?: GroupsClient
  onCreated: () => void
}

export const CreateGroupForm = ({ client = groupsClient, onCreated }: Props) => {
  const [error, setError] = useState('')
  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: '' }
  })

  const onSubmit: SubmitHandler<CreateGroupInput> = async ({ name }) => {
    try {
      await client.create(name)
      form.reset()
      setError('')
      onCreated()
    } catch (error) {
      setError(errorMessage(error, 'Impossible de créer le Groupe'))
    }
  }

  return <CreateGroupFields form={form} error={error} onSubmit={onSubmit} />
}
