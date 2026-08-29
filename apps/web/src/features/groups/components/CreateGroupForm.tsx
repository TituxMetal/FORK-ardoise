import { useState, type SubmitEventHandler } from 'react'
import { Alert, Button, FormWrapper, Input } from '~ui/index'
import { errorMessage } from '~/lib/errorMessage'
import { field } from '~/lib/forms'
import { groupsClient, type GroupsClient } from '~features/groups/api'

type Props = {
  client?: GroupsClient
  onCreated: () => void
}

export const CreateGroupForm = ({ client = groupsClient, onCreated }: Props) => {
  const [error, setError] = useState('')

  const create: SubmitEventHandler<HTMLFormElement> = async event => {
    event.preventDefault()
    const name = field(new FormData(event.currentTarget), 'name')
    event.currentTarget.reset()
    try {
      await client.create(name)
      setError('')
      onCreated()
    } catch (error) {
      setError(errorMessage(error, 'Impossible de créer le Groupe'))
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={create}>
      {error ? <Alert message={error} /> : null}
      <h2 className="text-lg font-medium">Créer un Groupe</h2>
      <FormWrapper label="Nom">
        <Input name="name" required />
      </FormWrapper>
      <Button type="submit">Créer le Groupe</Button>
    </form>
  )
}
