import { useEffect, useState, type FormEvent } from 'react'
import { Expenses } from '../features/expenses/Expenses.tsx'
import { groupsClient, type GroupDto, type GroupsClient } from '../features/groups/client.ts'
import { Services } from '../features/services/Services.tsx'
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
          <Expenses
            group={group}
            client={client}
            onChange={next => {
              setGroup(next)
              setError('')
            }}
          />
          <Services
            group={group}
            client={client}
            onChange={next => {
              setGroup(next)
              setError('')
            }}
          />
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
      ) : error ? null : (
        <p>Chargement…</p>
      )}
    </section>
  )
}
