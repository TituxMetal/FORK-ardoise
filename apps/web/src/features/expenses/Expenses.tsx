import { useState, type FormEvent } from 'react'
import { centsFromEuros, euros } from '../../lib/amounts.ts'
import { field } from '../../lib/forms.ts'
import { groupsClient, type GroupDto, type GroupsClient } from '../groups/client.ts'

type Props = {
  group: GroupDto
  client?: GroupsClient
  onChange: (group: GroupDto) => void
}

export const Expenses = ({ group, client = groupsClient, onChange }: Props) => {
  const [error, setError] = useState('')

  const createExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const selected = form.getAll('participantIds').filter(value => typeof value === 'string')
    event.currentTarget.reset()
    try {
      onChange(
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
    try {
      onChange(await client.deleteExpense(group.id, expenseId))
      setError('')
    } catch {
      setError('Dépense introuvable')
    }
  }

  return (
    <>
      {error ? (
        <p className="text-red-400" role="alert">
          {error}
        </p>
      ) : null}
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
              <input type="checkbox" name="participantIds" value={member.userId} defaultChecked />
              {member.name}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="rounded bg-zinc-100 px-3 py-2 text-zinc-900">
          Constater la Dépense
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
    </>
  )
}
