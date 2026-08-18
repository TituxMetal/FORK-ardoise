import { useEffect, useState } from 'react'
import { groupsClient, type GroupDto, type GroupsClient } from '../features/groups/client.ts'
import { SessionForms } from '../features/session/SessionForms.tsx'

type Props = {
  secret: string
  session: { name: string } | null
  client?: GroupsClient
}

export const InvitePage = ({ secret, session, client = groupsClient }: Props) => {
  const sessionName = session?.name
  const [group, setGroup] = useState<GroupDto | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    if (!sessionName) {
      return
    }
    void client
      .join(secret)
      .then(setGroup)
      .catch(() => setError('Invitation introuvable'))
  }, [client, secret, sessionName])

  if (!session) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Invitation</h2>
        <p>Ouvre une session pour rejoindre le Groupe.</p>
        <SessionForms />
      </section>
    )
  }

  if (error) {
    return (
      <p className="text-red-400" role="alert">
        {error}
      </p>
    )
  }

  if (!group) {
    return <p>Chargement…</p>
  }

  return (
    <article className="space-y-2">
      <h2 className="text-lg font-medium">{group.name}</h2>
      <ul>
        {group.members.map(member => (
          <li key={member.userId}>{member.name}</li>
        ))}
      </ul>
    </article>
  )
}
