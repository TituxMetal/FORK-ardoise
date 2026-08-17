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

const centsFromEuros = (value: string) => Math.round(Number(value.replace(',', '.')) * 100)

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
  const [debtorId, setDebtorId] = useState('')
  const [creditorId, setCreditorId] = useState('')

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

  const createPayback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!opened) {
      return
    }
    const form = new FormData(event.currentTarget)
    event.currentTarget.reset()
    try {
      setOpened(
        await client.createPayback(opened.id, {
          debtorId: field(form, 'debtorId'),
          creditorId: field(form, 'creditorId'),
          amount: centsFromEuros(field(form, 'amount'))
        })
      )
      setError('')
    } catch {
      setError('Impossible de constater le Règlement')
    }
  }

  const deletePayback = async (paybackId: string) => {
    if (!opened) {
      return
    }
    try {
      setOpened(await client.deletePayback(opened.id, paybackId))
      setError('')
    } catch {
      setError('Règlement introuvable')
    }
  }

  const creditors =
    opened?.balances
      .filter(solde => solde.amount > 0)
      .slice()
      .sort((a, b) => b.amount - a.amount) ?? []
  const selectedDebtorId = opened?.members.some(membre => membre.userId === debtorId)
    ? debtorId
    : (opened?.balances.find(solde => solde.amount < 0)?.userId ?? opened?.members[0]?.userId ?? '')
  const selectedCreditorId = creditors.some(solde => solde.userId === creditorId)
    ? creditorId
    : (creditors[0]?.userId ?? '')
  const nameOf = (userId: string) =>
    opened?.members.find(membre => membre.userId === userId)?.name ?? userId
  const plafond = opened
    ? Math.min(
        -(opened.balances.find(solde => solde.userId === selectedDebtorId)?.amount ?? 0),
        opened.balances.find(solde => solde.userId === selectedCreditorId)?.amount ?? 0
      )
    : 0

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
          <form
            className="flex flex-col gap-3"
            aria-label="Constater un Règlement"
            onSubmit={createPayback}
          >
            <h3 className="font-medium">Qui doit quoi</h3>
            <label className="flex flex-col gap-1">
              Débiteur
              <select
                name="debtorId"
                required
                value={selectedDebtorId}
                onChange={event => setDebtorId(event.target.value)}
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
              >
                {opened.members.map(membre => (
                  <option key={membre.userId} value={membre.userId}>
                    {membre.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              Créancier
              <select
                name="creditorId"
                required
                value={selectedCreditorId}
                onChange={event => setCreditorId(event.target.value)}
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
              >
                {creditors.map(solde => (
                  <option key={solde.userId} value={solde.userId}>
                    {solde.name}
                  </option>
                ))}
              </select>
            </label>
            <p>Plafond {euros(plafond)}</p>
            <label className="flex flex-col gap-1">
              Montant
              <input
                name="amount"
                required
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
              />
            </label>
            <button type="submit" className="rounded bg-zinc-100 px-3 py-2 text-zinc-900">
              Constater le Règlement
            </button>
          </form>
          {opened.expenses.length === 0 ? (
            <p>Aucune Dépense</p>
          ) : (
            <ul className="space-y-2">
              {opened.expenses.map(expense => (
                <li key={expense.id} className="space-y-1">
                  <p>{expense.label}</p>
                  <p>{expense.day}</p>
                  <p>{euros(expense.amount)}</p>
                  <button
                    type="button"
                    className="rounded bg-zinc-800 px-3 py-2"
                    onClick={() => void deleteExpense(expense.id)}
                  >
                    Supprimer {expense.label}
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
          {opened.paybacks.length === 0 ? (
            <p>Aucun Règlement</p>
          ) : (
            <ul className="space-y-2">
              {opened.paybacks.map(payback => (
                <li key={payback.id} className="space-y-1">
                  <p>
                    {nameOf(payback.debtorId)} → {nameOf(payback.creditorId)}{' '}
                    {euros(payback.amount)}
                  </p>
                  <button
                    type="button"
                    className="rounded bg-zinc-800 px-3 py-2"
                    onClick={() => void deletePayback(payback.id)}
                  >
                    Supprimer le Règlement {nameOf(payback.debtorId)} → {nameOf(payback.creditorId)}
                  </button>
                </li>
              ))}
            </ul>
          )}
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
