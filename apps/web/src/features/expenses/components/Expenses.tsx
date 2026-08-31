import { useStore } from '@nanostores/react'
import { $group, SlateEntryList } from '~features/groups'
import { dayLabel, initials } from '~/lib/format'
import { expensesClient } from '../api'
import type { ExpensesClient } from '../types'
import { EditExpenseForm } from './EditExpenseForm'

type Props = {
  client?: ExpensesClient
}

export const Expenses = ({ client = expensesClient }: Props) => {
  const group = useStore($group)
  if (!group) return null
  const nameOf = (userId: string) =>
    group.members.find(member => member.userId === userId)?.name ?? userId
  return (
    <SlateEntryList
      kind="expenses"
      entries={group.expenses}
      emptyText="Aucune Dépense"
      notFoundMessage="Dépense introuvable"
      client={client}
      rowFor={expense => ({
        initials: initials(nameOf(expense.payerId)),
        label: expense.label,
        detail: `${nameOf(expense.payerId)} · ${dayLabel(expense.day)}`,
        amount: expense.amount,
        confirmLabel: `Supprimer « ${expense.label} » ?`
      })}
      renderEditForm={(entryId, onCancel) => (
        <EditExpenseForm key={entryId} expenseId={entryId} client={client} onCancel={onCancel} />
      )}
    />
  )
}
