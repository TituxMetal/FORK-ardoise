import { useState } from 'react'
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form'
import { useStore } from '@nanostores/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { centsFromEuros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { $group, applyGroup } from '~features/groups'
import { paybacksClient } from '../api'
import { createPaybackSchema, type CreatePaybackFormInput } from '../schemas'
import type { PaybacksClient } from '../types'
import { PaybackFields } from './PaybackFields'

type Props = {
  client?: PaybacksClient
  onCancel?: () => void
}

export const PaybackForm = ({ client = paybacksClient, onCancel }: Props) => {
  const group = useStore($group)
  const [error, setError] = useState('')
  const form = useForm<CreatePaybackFormInput>({
    resolver: zodResolver(createPaybackSchema),
    defaultValues: { debtorId: '', creditorId: '', amount: '', day: '' }
  })
  const debtorId = useWatch({ control: form.control, name: 'debtorId' })
  const creditorId = useWatch({ control: form.control, name: 'creditorId' })

  const members = group?.members ?? []
  const creditors =
    group?.balances.filter(balance => balance.amount > 0).sort((a, b) => b.amount - a.amount) ?? []
  // An untouched select re-derives its default from the current Balances; a
  // touched one keeps the choice while it stays valid.
  const effectiveDebtorId = members.some(member => member.userId === debtorId)
    ? debtorId
    : (group?.balances.find(balance => balance.amount < 0)?.userId ?? members[0]?.userId ?? '')
  const effectiveCreditorId = creditors.some(balance => balance.userId === creditorId)
    ? creditorId
    : (creditors[0]?.userId ?? '')
  const cap = group
    ? Math.min(
        -(group.balances.find(balance => balance.userId === effectiveDebtorId)?.amount ?? 0),
        group.balances.find(balance => balance.userId === effectiveCreditorId)?.amount ?? 0
      )
    : 0

  const onSubmit: SubmitHandler<CreatePaybackFormInput> = async values => {
    if (!group) return
    try {
      applyGroup(
        await client.create(group.id, {
          debtorId: effectiveDebtorId,
          creditorId: effectiveCreditorId,
          day: values.day,
          amount: centsFromEuros(values.amount)
        })
      )
      form.setValue('amount', '')
      setError('')
    } catch (error) {
      setError(errorMessage(error, 'Impossible de constater le Règlement'))
    }
  }

  if (!group) return null

  return (
    <PaybackFields
      form={form}
      error={error}
      onSubmit={onSubmit}
      members={members}
      creditors={creditors}
      debtorId={effectiveDebtorId}
      creditorId={effectiveCreditorId}
      cap={cap}
      onCancel={() => {
        form.reset()
        onCancel?.()
      }}
    />
  )
}
