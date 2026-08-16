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

const euros = (cents: number) =>
  `${cents < 0 ? '−' : ''}${(Math.abs(cents) / 100).toFixed(2).replace('.', ',')} €`

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

  const createExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!opened) {
      return
    }
    const form = new FormData(event.currentTarget)
    const selected = form.getAll('participantIds').filter(value => typeof value === 'string')
    event.currentTarget.reset()
    try {
      setOpened(
        await client.createExpense(opened.id, {
          label: field(form, 'label'),
          day: field(form, 'day'),
          amount: Math.round(Number(field(form, 'amount')) * 100),
          payerId: field(form, 'payerId'),
          participantIds: selected.length > 0 ? selected : undefined
        })
      )
      setError('')
    } catch {
      setError('Impossible de constater la Dépense')
    }
  }

  const deleteExpense = async (expenseId: string) => {
    if (!opened) {
      return
    }
    try {
      setOpened(await client.deleteExpense(opened.id, expenseId))
      setError('')
    } catch {
      setError('Dépense introuvable')
    }
  }

  const createService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!opened) {
      return
    }
    const form = new FormData(event.currentTarget)
    const selected = form.getAll('participantIds').filter(value => typeof value === 'string')
    event.currentTarget.reset()
    try {
      setOpened(
        await client.createService(opened.id, {
          label: field(form, 'label'),
          day: field(form, 'day'),
          amount: Math.round(Number(field(form, 'amount')) * 100),
          providerId: field(form, 'providerId'),
          participantIds: selected.length > 0 ? selected : undefined
        })
      )
      setError('')
    } catch {
      setError('Impossible de constater le Service')
    }
  }

  const deleteService = async (serviceId: string) => {
    if (!opened) {
      return
    }
    try {
      setOpened(await client.deleteService(opened.id, serviceId))
      setError('')
    } catch {
      setError('Service introuvable')
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
        <article className="space-y-4">
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
          <form
            className="flex flex-col gap-3"
            aria-label="Constater une Dépense"
            onSubmit={createExpense}
          >
            <h3 className="font-medium">Constater une Dépense</h3>
            <label className="flex flex-col gap-1">
              Libellé
              <input
                name="label"
                required
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              Jour
              <input
                name="day"
                required
                placeholder="YYYY-MM-DD"
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              Montant
              <input
                name="amount"
                required
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              Payeur
              <select
                name="payerId"
                required
                defaultValue={opened.members[0]?.userId}
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
              >
                {opened.members.map(membre => (
                  <option key={membre.userId} value={membre.userId}>
                    {membre.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="flex flex-col gap-1">
              <legend>Participants</legend>
              {opened.members.map(membre => (
                <label key={membre.userId} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="participantIds"
                    value={membre.userId}
                    defaultChecked
                  />
                  {membre.name}
                </label>
              ))}
            </fieldset>
            <button type="submit" className="rounded bg-zinc-100 px-3 py-2 text-zinc-900">
              Constater la Dépense
            </button>
          </form>
          <form
            className="flex flex-col gap-3"
            aria-label="Constater un Service"
            onSubmit={createService}
          >
            <h3 className="font-medium">Constater un Service</h3>
            <label className="flex flex-col gap-1">
              Libellé
              <input
                name="label"
                required
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              Jour
              <input
                name="day"
                required
                placeholder="YYYY-MM-DD"
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              Montant
              <input
                name="amount"
                required
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              Prestataire
              <select
                name="providerId"
                required
                defaultValue={opened.members[0]?.userId}
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
              >
                {opened.members.map(membre => (
                  <option key={membre.userId} value={membre.userId}>
                    {membre.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="flex flex-col gap-1">
              <legend>Participants</legend>
              {opened.members.map(membre => (
                <label key={membre.userId} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="participantIds"
                    value={membre.userId}
                    defaultChecked
                  />
                  {membre.name}
                </label>
              ))}
            </fieldset>
            <button type="submit" className="rounded bg-zinc-100 px-3 py-2 text-zinc-900">
              Constater le Service
            </button>
          </form>
          {opened.expenses.length === 0 ? (
            <p>Aucune Dépense</p>
          ) : (
            <ul className="space-y-2">
              {opened.expenses.map(depense => (
                <li key={depense.id} className="space-y-1">
                  <p>{depense.label}</p>
                  <p>{depense.day}</p>
                  <p>{euros(depense.amount)}</p>
                  <button
                    type="button"
                    className="rounded bg-zinc-800 px-3 py-2"
                    onClick={() => void deleteExpense(depense.id)}
                  >
                    Supprimer {depense.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {opened.services.length === 0 ? (
            <p>Aucun Service</p>
          ) : (
            <ul className="space-y-2">
              {opened.services.map(service => (
                <li key={service.id} className="space-y-1">
                  <p>{service.label}</p>
                  <p>{service.day}</p>
                  <p>{euros(service.amount)}</p>
                  <button
                    type="button"
                    className="rounded bg-zinc-800 px-3 py-2"
                    onClick={() => void deleteService(service.id)}
                  >
                    Supprimer {service.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p>Aucun Règlement</p>
          <ul>
            {opened.balances.map(solde => (
              <li key={solde.userId}>
                {solde.name} {euros(solde.amount)}
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  )
}
