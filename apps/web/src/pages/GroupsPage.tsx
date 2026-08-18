import { useEffect, useState } from 'react'
import { CreateGroupForm } from '../features/groups/CreateGroupForm.tsx'
import { groupsClient, type GroupsClient, type GroupSummary } from '../features/groups/client.ts'
import { GroupsList } from '../features/groups/GroupsList.tsx'

type Props = {
  client?: GroupsClient
}

export const GroupsPage = ({ client = groupsClient }: Props) => {
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    void client
      .list()
      .then(setGroups)
      .catch(() => setError('Impossible de lister les Groupes'))
  }, [client])

  const refresh = async () => {
    try {
      setGroups(await client.list())
      setError('')
    } catch {
      setError('Impossible de lister les Groupes')
    }
  }

  return (
    <section className="space-y-4">
      {error ? (
        <p className="text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <CreateGroupForm client={client} onCreated={() => void refresh()} />
      <GroupsList groups={groups} />
    </section>
  )
}
