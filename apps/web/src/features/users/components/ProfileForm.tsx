import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { errorMessage } from '~/lib/errorMessage'
import { usersClient } from '../api'
import { updateNameSchema, type UpdateNameInput } from '../schemas'
import type { UsersClient } from '../types'
import { ProfileFields } from './ProfileFields'

type Props = {
  initialName: string
  client?: UsersClient
  onRenamed?: (name: string) => void
}

export const ProfileForm = ({ initialName, client = usersClient, onRenamed }: Props) => {
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const form = useForm<UpdateNameInput>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: { name: initialName }
  })

  const onSubmit: SubmitHandler<UpdateNameInput> = async ({ name }) => {
    try {
      const result = await client.rename(name)
      form.reset({ name: result.name })
      setError('')
      setSaved(true)
      onRenamed?.(result.name)
    } catch (error) {
      setSaved(false)
      setError(errorMessage(error, 'Impossible de modifier le nom'))
    }
  }

  return <ProfileFields form={form} error={error} saved={saved} onSubmit={onSubmit} />
}
