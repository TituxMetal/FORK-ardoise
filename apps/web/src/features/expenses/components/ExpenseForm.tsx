import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { useStore } from '@nanostores/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { centsFromEuros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { $group, applyGroup } from '~features/groups'
import { expensesClient } from '../api'
import { createExpenseSchema, type CreateExpenseFormInput } from '../schemas'
import type { ExpensesClient } from '../types'
import { ExpenseFields } from './ExpenseFields'

type Props = {
  client?: ExpensesClient
}

export const ExpenseForm = ({ client = expensesClient }: Props) => {
  const group = useStore($group)
  const [error, setError] = useState('')
  const form = useForm<CreateExpenseFormInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      label: '',
      day: '',
      amount: '',
      payerId: group?.members[0]?.userId ?? '',
      participantIds: group?.members.map(member => member.userId) ?? []
    }
  })

  const onSubmit: SubmitHandler<CreateExpenseFormInput> = async values => {
    if (!group) return
    try {
      applyGroup(
        await client.create(group.id, {
          label: values.label,
          day: values.day,
          amount: centsFromEuros(values.amount),
          payerId: values.payerId,
          participantIds:
            values.participantIds && values.participantIds.length > 0
              ? values.participantIds
              : undefined
        })
      )
      form.reset()
      setError('')
    } catch (error) {
      setError(errorMessage(error, 'Impossible de constater la Dépense'))
    }
  }

  if (!group) return null

  return <ExpenseFields form={form} error={error} onSubmit={onSubmit} members={group.members} />
}
