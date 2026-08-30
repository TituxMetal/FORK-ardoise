import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { Alert, Button } from '~ui'
import { euros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { $group, applyGroup } from '~features/groups'
import { expensesClient } from '../api'
import type { ExpensesClient } from '../types'

type Props = {
  client?: ExpensesClient
}

export const Expenses = ({ client = expensesClient }: Props) => {
  const group = useStore($group)
  const [error, setError] = useState('')

  const deleteExpense = async (expenseId: string) => {
    if (!group) return
    try {
      applyGroup(await client.delete(group.id, expenseId))
      setError('')
    } catch (error) {
      setError(errorMessage(error, 'Dépense introuvable'))
    }
  }

  if (!group) return null

  return (
    <>
      {error ? <Alert message={error} /> : null}
      {group.expenses.length === 0 ? (
        <p>Aucune Dépense</p>
      ) : (
        <ul className="space-y-2">
          {group.expenses.map(expense => (
            <li key={expense.id} className="space-y-1">
              <p>{expense.label}</p>
              <p>{expense.day}</p>
              <p>{euros(expense.amount)}</p>
              <Button
                variant="secondary"
                type="button"
                onClick={() => void deleteExpense(expense.id)}
              >
                Supprimer {expense.label}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
