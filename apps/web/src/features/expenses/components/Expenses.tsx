import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { Alert, EntryRow } from '~ui'
import { euros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { dayLabel, initials } from '~/lib/format'
import { $editing, $group, applyGroup, cancelEdit, startEdit } from '~features/groups'
import { expensesClient } from '../api'
import type { ExpensesClient } from '../types'
import { EditExpenseForm } from './EditExpenseForm'

type Props = {
  client?: ExpensesClient
}

export const Expenses = ({ client = expensesClient }: Props) => {
  const group = useStore($group)
  const editing = useStore($editing)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const deleteExpense = async (expenseId: string) => {
    if (!group) return
    try {
      applyGroup(await client.delete(group.id, expenseId))
      setError('')
      setConfirmingId(null)
    } catch (error) {
      setError(errorMessage(error, 'Dépense introuvable'))
    }
  }

  if (!group) return null

  const nameOf = (userId: string) =>
    group.members.find(member => member.userId === userId)?.name ?? userId

  return (
    <>
      {error ? <Alert message={error} /> : null}
      {editing?.kind === 'expenses' ? (
        <EditExpenseForm expenseId={editing.id} client={client} onCancel={cancelEdit} />
      ) : null}
      {group.expenses.length === 0 ? (
        <p>Aucune Dépense</p>
      ) : (
        <ul className="space-y-2">
          {group.expenses.map(expense => (
            <EntryRow
              key={expense.id}
              initials={initials(nameOf(expense.payerId))}
              label={expense.label}
              detail={`${nameOf(expense.payerId)} · ${dayLabel(expense.day)}`}
              amount={euros(expense.amount)}
              onEdit={() => {
                setConfirmingId(null)
                startEdit({ kind: 'expenses', id: expense.id })
              }}
              onRequestDelete={() => setConfirmingId(expense.id)}
              confirming={confirmingId === expense.id}
              confirmLabel={`Supprimer « ${expense.label} » ?`}
              onConfirm={() => void deleteExpense(expense.id)}
              onCancel={() => setConfirmingId(null)}
            />
          ))}
        </ul>
      )}
    </>
  )
}
