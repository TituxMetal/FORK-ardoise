import { useState, type FormEvent } from 'react'
import { errorMessage } from '~/lib/errorMessage'
import { field } from '~/lib/forms'
import { groupsClient, type GroupsClient } from '~features/groups/api/groups.client'

type Props = {
  client?: GroupsClient
  onCreated: () => void
}

export const CreateGroupForm = ({ client = groupsClient, onCreated }: Props) => {
  const [error, setError] = useState('')

  const create = async (event: FormEvent<HTMLFormElement>) => {
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
      {error ? (
        <p className="text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <h2 className="text-lg font-medium">Créer un Groupe</h2>
      <label className="flex flex-col gap-1">
        Nom
        <input
          name="name"
          required
          className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
        />
      </label>
      <button type="submit" className="rounded bg-zinc-100 px-3 py-2 text-zinc-900">
        Créer le Groupe
      </button>
    </form>
  )
}
