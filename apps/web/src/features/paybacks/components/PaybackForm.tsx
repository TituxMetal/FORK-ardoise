import { useState } from 'react'
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form'
import { useStore } from '@nanostores/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { centsFromEuros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { $group, applyGroup } from '~features/groups'
import { paybacksClient } from '../api'
import { enforcePaybackCap, paybackFieldsSchema, type CreatePaybackFormInput } from '../schemas'
import type { PaybacksClient } from '../types'
import { paybackCap, paybackCreditors } from '../utils'
import { PaybackFields } from './PaybackFields'

type Props = {
  client?: PaybacksClient
  onCancel?: () => void
}

export const PaybackForm = ({ client = paybacksClient, onCancel }: Props) => {
  const group = useStore($group)
  const [error, setError] = useState('')
  const form = useForm<CreatePaybackFormInput>({
    resolver: zodResolver(paybackFieldsSchema),
    defaultValues: { debtorId: '', creditorId: '', amount: '', day: '' }
  })
  const debtorId = useWatch({ control: form.control, name: 'debtorId' })
  const creditorId = useWatch({ control: form.control, name: 'creditorId' })

  const members = group?.members ?? []
  const balances = group?.balances ?? []
  const creditors = paybackCreditors(balances, null)
  // An untouched select re-derives its default from the current Balances; a
  // touched one keeps the choice while it stays valid.
  const effectiveDebtorId = members.some(member => member.userId === debtorId)
    ? debtorId
    : (balances.find(balance => balance.amount < 0)?.userId ?? members[0]?.userId ?? '')
  const effectiveCreditorId = creditors.some(balance => balance.userId === creditorId)
    ? creditorId
    : (creditors[0]?.userId ?? '')
  const cap = group ? paybackCap(balances, null, effectiveDebtorId, effectiveCreditorId) : 0

  const onSubmit: SubmitHandler<CreatePaybackFormInput> = async values => {
    if (!group) return
    if (enforcePaybackCap(form, cap, values)) return
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
