import { useEffect, useState } from 'react'
import { authClient } from '../infrastructure/CreateAuth.client.ts'
import {
  groupesClient,
  type GroupeDto,
  type GroupesClient
} from '../infrastructure/CreateGroupes.client.ts'
import { SessionForms } from './SessionForms.tsx'

type SessionUser = {
  name: string
}

type Props = {
  secret: string
  session: SessionUser | null
  client?: GroupesClient
}

export const InvitationScreen = ({ secret, session, client = groupesClient }: Props) => {
  const sessionName = session?.name
  const [groupe, setGroupe] = useState<GroupeDto | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionName) {
      return
    }
    void client
      .join(secret)
      .then(setGroupe)
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

  if (!groupe) {
    return <p>Chargement…</p>
  }

  return (
    <article className="space-y-2">
      <h2 className="text-lg font-medium">{groupe.name}</h2>
      <ul>
        {groupe.members.map(membre => (
          <li key={membre.userId}>{membre.name}</li>
        ))}
      </ul>
    </article>
  )
}

export const InvitationPage = ({ secret }: { secret: string }) => {
  const { data, isPending } = authClient.useSession()
  if (isPending) {
    return <p>Chargement…</p>
  }
  return <InvitationScreen secret={secret} session={data ? { name: data.user.name } : null} />
}
