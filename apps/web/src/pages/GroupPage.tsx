import { useEffect, useState } from 'react'
import { Expenses } from '../features/expenses/Expenses.tsx'
import { groupsClient, type GroupDto, type GroupsClient } from '../features/groups/client.ts'
import { Paybacks } from '../features/paybacks/Paybacks.tsx'
import { Services } from '../features/services/Services.tsx'
import { Link } from '../lib/router.tsx'

type Props = {
  id: string
  client?: GroupsClient
  copy?: (text: string) => Promise<void>
}

export const GroupPage = ({
  id,
  client = groupsClient,
  copy = text => navigator.clipboard.writeText(text)
}: Props) => {
  const [group, setGroup] = useState<GroupDto | null>(null)
  const [error, setError] = useState('')

  const apply = (next: GroupDto) => {
    setGroup(next)
    setError('')
  }

  useEffect(() => {
    setGroup(null)
    setError('')
    void client
      .get(id)
      .then(fetched => {
        setGroup(fetched)
        setError('')
      })
      .catch(() => setError('Groupe introuvable'))
  }, [client, id])

  return (
    <section className="space-y-4">
      <Link to="/" className="inline-block rounded bg-zinc-800 px-3 py-2">
        ← Retour aux Groupes
      </Link>
      {error ? (
        <p className="text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {group ? (
        <article className="space-y-4">
          <h2 className="text-lg font-medium">{group.name}</h2>
          <button
            type="button"
            className="rounded bg-zinc-100 px-3 py-2 text-zinc-900"
            onClick={() => void copy(`${window.location.origin}/invites/${group.invite.secret}`)}
          >
            Copier le lien d’Invitation
          </button>
          <Expenses group={group} client={client} onChange={apply} />
          <Services group={group} client={client} onChange={apply} />
          <Paybacks group={group} client={client} onChange={apply} />
        </article>
      ) : error ? null : (
        <p>Chargement…</p>
      )}
    </section>
  )
}
