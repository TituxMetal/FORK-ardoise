import { useState, type SubmitEventHandler } from 'react'
import { useStore } from '@nanostores/react'
import { Alert, Button, FormWrapper, Input, Select } from '~ui'
import { centsFromEuros, euros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { field } from '~/lib/forms'
import { $group, applyGroup } from '~features/groups'
import { expensesClient } from '../api'
import type { ExpensesClient } from '../types'

type Props = {
  client?: ExpensesClient
}

export const Expenses = ({ client = expensesClient }: Props) => {
  const group = useStore($group)
  const [error, setError] = useState('')

  const createExpense: SubmitEventHandler<HTMLFormElement> = async event => {
    event.preventDefault()
    if (!group) return
    const form = new FormData(event.currentTarget)
    const selected = form.getAll('participantIds').filter(value => typeof value === 'string')
    event.currentTarget.reset()
    try {
      applyGroup(
        await client.create(group.id, {
          label: field(form, 'label'),
          day: field(form, 'day'),
          amount: centsFromEuros(field(form, 'amount')),
          payerId: field(form, 'payerId'),
          participantIds: selected.length > 0 ? selected : undefined
        })
      )
      setError('')
    } catch (error) {
      setError(errorMessage(error, 'Impossible de constater la Dépense'))
    }
  }

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
      <form
        className="flex flex-col gap-3"
        aria-label="Constater une Dépense"
        onSubmit={createExpense}
      >
        <h3 className="font-medium">Constater une Dépense</h3>
        <FormWrapper label="Libellé">
          <Input name="label" required />
        </FormWrapper>
        <FormWrapper label="Jour">
          <Input name="day" required placeholder="YYYY-MM-DD" />
        </FormWrapper>
        <FormWrapper label="Montant">
          <Input name="amount" required />
        </FormWrapper>
        <FormWrapper label="Payeur">
          <Select name="payerId" required defaultValue={group.members[0]?.userId}>
            {group.members.map(member => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </Select>
        </FormWrapper>
        <fieldset className="flex flex-col gap-1">
          <legend>Participants</legend>
          {group.members.map(member => (
            <label key={member.userId} className="flex items-center gap-2">
              <input type="checkbox" name="participantIds" value={member.userId} defaultChecked />
              {member.name}
            </label>
          ))}
        </fieldset>
        <Button type="submit">Constater la Dépense</Button>
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
