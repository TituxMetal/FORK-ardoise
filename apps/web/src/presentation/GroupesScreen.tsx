import { useEffect, useState, type FormEvent } from 'react'
import {
  groupesClient,
  type GroupeDto,
  type GroupesClient,
  type GroupeSummary
} from '../infrastructure/CreateGroupes.client.ts'

const field = (form: FormData, name: string) => {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

type Props = {
  client?: GroupesClient
  copy?: (text: string) => Promise<void>
}

export const GroupesScreen = ({
  client = groupesClient,
  copy = text => navigator.clipboard.writeText(text)
}: Props) => {
  const [groupes, setGroupes] = useState<GroupeSummary[]>([])
  const [opened, setOpened] = useState<GroupeDto | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void client
      .list()
      .then(setGroupes)
      .catch(() => setError('Impossible de lister les Groupes'))
  }, [client])

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = field(new FormData(event.currentTarget), 'name')
    event.currentTarget.reset()
    try {
      await client.create(name)
      setError('')
      setGroupes(await client.list())
    } catch {
      setError('Impossible de créer le Groupe')
    }
  }

  const open = async (id: string) => {
    try {
      setOpened(await client.get(id))
      setError('')
    } catch {
      setError('Groupe introuvable')
    }
  }

  return (
    <section className="space-y-4">
      {error ? (
        <p className="text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <form className="flex flex-col gap-3" onSubmit={create}>
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
      <div className="space-y-2">
        <h2 className="text-lg font-medium">Mes Groupes</h2>
        <ul className="space-y-1">
          {groupes.map(groupe => (
            <li key={groupe.id}>
              <button
                type="button"
                className="rounded bg-zinc-800 px-3 py-2"
                onClick={() => void open(groupe.id)}
              >
                {groupe.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {opened ? (
        <article className="space-y-2">
          <h2 className="text-lg font-medium">{opened.name}</h2>
          <button
            type="button"
            className="rounded bg-zinc-100 px-3 py-2 text-zinc-900"
            onClick={() =>
              void copy(`${window.location.origin}/invitations/${opened.invitation.secret}`)
            }
          >
            Copier le lien d’Invitation
          </button>
          <p>Aucune Dépense</p>
          <p>Aucun Service</p>
          <p>Aucun Règlement</p>
          <ul>
            {opened.balances.map(solde => (
              <li key={solde.userId}>
                {solde.name} {solde.amount}
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  )
}
