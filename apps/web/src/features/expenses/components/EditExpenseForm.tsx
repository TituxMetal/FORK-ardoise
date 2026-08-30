import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { useStore } from '@nanostores/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { centsFromEuros, eurosFromCents } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { $group, applyGroup } from '~features/groups'
import { expensesClient } from '../api'
import { createExpenseSchema, type CreateExpenseFormInput } from '../schemas'
import type { ExpensesClient } from '../types'
import { ExpenseFields } from './ExpenseFields'

type Props = {
  expenseId: string
  client?: ExpensesClient
  onCancel?: () => void
}

export const EditExpenseForm = ({ expenseId, client = expensesClient, onCancel }: Props) => {
  const group = useStore($group)
  const [error, setError] = useState('')
  const expense = group?.expenses.find(item => item.id === expenseId)
  const form = useForm<CreateExpenseFormInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: expense
      ? {
          label: expense.label,
          day: expense.day,
          amount: eurosFromCents(expense.amount),
          payerId: expense.payerId,
          participantIds: expense.participantIds
        }
      : { label: '', day: '', amount: '', payerId: '', participantIds: [] }
  })

  const onSubmit: SubmitHandler<CreateExpenseFormInput> = async values => {
    if (!group || !expense) return
    try {
      applyGroup(
        await client.update(group.id, expense.id, {
          label: values.label,
          day: values.day,
          amount: centsFromEuros(values.amount),
          payerId: values.payerId,
          participantIds: values.participantIds
        })
      )
      setError('')
      onCancel?.()
    } catch (error) {
      setError(errorMessage(error, 'Impossible de modifier la Dépense'))
    }
  }

  if (!group || !expense) return null

  return (
    <ExpenseFields
      form={form}
      error={error}
      onSubmit={onSubmit}
      members={group.members}
      mode="edit"
      onCancel={() => {
        form.reset()
        onCancel?.()
      }}
    />
  )
}
