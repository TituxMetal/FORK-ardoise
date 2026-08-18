import { useEffect, useState, type FormEvent } from 'react'
import { groupsClient, type GroupDto, type GroupsClient } from '../features/groups/client.ts'
import { centsFromEuros, euros } from '../lib/amounts.ts'
import { field } from '../lib/forms.ts'
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
  const [debtorId, setDebtorId] = useState('')
  const [creditorId, setCreditorId] = useState('')

  useEffect(() => {
    void client
      .get(id)
      .then(fetched => {
        setGroup(fetched)
        setError('')
      })
      .catch(() => setError('Groupe introuvable'))
  }, [client, id])

  const createExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!group) {
      return
    }
    const form = new FormData(event.currentTarget)
    const selected = form.getAll('participantIds').filter(value => typeof value === 'string')
    event.currentTarget.reset()
    try {
      setGroup(
        await client.createExpense(group.id, {
          label: field(form, 'label'),
          day: field(form, 'day'),
          amount: centsFromEuros(field(form, 'amount')),
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
    if (!group) {
      return
    }
    try {
      setGroup(await client.deleteExpense(group.id, expenseId))
      setError('')
    } catch {
      setError('Dépense introuvable')
    }
  }

  const createService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!group) {
      return
    }
    const form = new FormData(event.currentTarget)
    const selected = form.getAll('participantIds').filter(value => typeof value === 'string')
    event.currentTarget.reset()
    try {
      setGroup(
        await client.createService(group.id, {
          label: field(form, 'label'),
          day: field(form, 'day'),
          amount: centsFromEuros(field(form, 'amount')),
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
    if (!group) {
      return
    }
    try {
      setGroup(await client.deleteService(group.id, serviceId))
      setError('')
    } catch {
      setError('Service introuvable')
    }
  }

  const createPayback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!group) {
      return
    }
    const form = new FormData(event.currentTarget)
    event.currentTarget.reset()
    try {
      setGroup(
        await client.createPayback(group.id, {
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
    if (!group) {
      return
    }
    try {
      setGroup(await client.deletePayback(group.id, paybackId))
      setError('')
    } catch {
      setError('Règlement introuvable')
    }
  }

  const creditors =
    group?.balances
      .filter(balance => balance.amount > 0)
      .slice()
      .sort((a, b) => b.amount - a.amount) ?? []
  const selectedDebtorId = group?.members.some(member => member.userId === debtorId)
    ? debtorId
    : (group?.balances.find(balance => balance.amount < 0)?.userId ??
      group?.members[0]?.userId ??
      '')
  const selectedCreditorId = creditors.some(balance => balance.userId === creditorId)
    ? creditorId
    : (creditors[0]?.userId ?? '')
  const nameOf = (userId: string) =>
    group?.members.find(member => member.userId === userId)?.name ?? userId
  const cap = group
    ? Math.min(
        -(group.balances.find(balance => balance.userId === selectedDebtorId)?.amount ?? 0),
        group.balances.find(balance => balance.userId === selectedCreditorId)?.amount ?? 0
      )
    : 0

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
                defaultValue={group.members[0]?.userId}
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
              >
                {group.members.map(member => (
                  <option key={member.userId} value={member.userId}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="flex flex-col gap-1">
              <legend>Participants</legend>
              {group.members.map(member => (
                <label key={member.userId} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="participantIds"
                    value={member.userId}
                    defaultChecked
                  />
                  {member.name}
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
                defaultValue={group.members[0]?.userId}
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
              >
                {group.members.map(member => (
                  <option key={member.userId} value={member.userId}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="flex flex-col gap-1">
              <legend>Participants</legend>
              {group.members.map(member => (
                <label key={member.userId} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="participantIds"
                    value={member.userId}
                    defaultChecked
                  />
                  {member.name}
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
                {group.members.map(member => (
                  <option key={member.userId} value={member.userId}>
                    {member.name}
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
                {creditors.map(balance => (
                  <option key={balance.userId} value={balance.userId}>
                    {balance.name}
                  </option>
                ))}
              </select>
            </label>
            <p>Plafond {euros(cap)}</p>
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
          {group.expenses.length === 0 ? (
            <p>Aucune Dépense</p>
          ) : (
            <ul className="space-y-2">
              {group.expenses.map(expense => (
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
          {group.services.length === 0 ? (
            <p>Aucun Service</p>
          ) : (
            <ul className="space-y-2">
              {group.services.map(service => (
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
          {group.paybacks.length === 0 ? (
            <p>Aucun Règlement</p>
          ) : (
            <ul className="space-y-2">
              {group.paybacks.map(payback => (
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
            {group.balances.map(balance => (
              <li key={balance.userId}>
                {balance.name} {euros(balance.amount)}
              </li>
            ))}
          </ul>
        </article>
      ) : (
        <p>Chargement…</p>
      )}
    </section>
  )
}
