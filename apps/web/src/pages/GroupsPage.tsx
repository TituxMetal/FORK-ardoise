import { useEffect, useState } from 'react'
import {
  CreateGroupForm,
  GroupsList,
  groupsClient,
  type GroupsClient,
  type GroupSummary
} from '~features/groups'

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
        <p className="text-negative" role="alert">
          {error}
        </p>
      ) : null}
      <CreateGroupForm client={client} onCreated={() => void refresh()} />
      <GroupsList groups={groups} />
    </section>
  )
}
