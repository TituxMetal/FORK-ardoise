import { useState } from 'react'
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form'
import { useStore } from '@nanostores/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { centsFromEuros, eurosFromCents } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { $group, applyGroup } from '~features/groups'
import { paybacksClient } from '../api'
import { createPaybackSchema, type CreatePaybackFormInput } from '../schemas'
import type { PaybacksClient } from '../types'
import { PaybackFields } from './PaybackFields'

type Props = {
  paybackId: string
  client?: PaybacksClient
  onCancel?: () => void
}

export const EditPaybackForm = ({ paybackId, client = paybacksClient, onCancel }: Props) => {
  const group = useStore($group)
  const [error, setError] = useState('')
  const payback = group?.paybacks.find(item => item.id === paybackId)
  const form = useForm<CreatePaybackFormInput>({
    resolver: zodResolver(createPaybackSchema),
    defaultValues: payback
      ? {
          debtorId: payback.debtorId,
          creditorId: payback.creditorId,
          amount: eurosFromCents(payback.amount)
        }
      : { debtorId: '', creditorId: '', amount: '' }
  })
  const debtorId = useWatch({ control: form.control, name: 'debtorId' })
  const creditorId = useWatch({ control: form.control, name: 'creditorId' })

  const members = group?.members ?? []
  // The Balances include the payback being edited; the cap and the creditor
  // list are re-derived without it, so a payback at the cap stays editable.
  const balanceWithout = (memberId: string) =>
    (group?.balances.find(balance => balance.userId === memberId)?.amount ?? 0) -
    (payback && memberId === payback.debtorId ? payback.amount : 0) +
    (payback && memberId === payback.creditorId ? payback.amount : 0)
  const creditors =
    group?.balances
      .map(balance => ({ ...balance, amount: balanceWithout(balance.userId) }))
      .filter(balance => balance.amount > 0)
      .sort((a, b) => b.amount - a.amount) ?? []
  const effectiveDebtorId = members.some(member => member.userId === debtorId)
    ? debtorId
    : (payback?.debtorId ?? members[0]?.userId ?? '')
  const effectiveCreditorId = creditors.some(balance => balance.userId === creditorId)
    ? creditorId
    : (payback?.creditorId ?? creditors[0]?.userId ?? '')
  const cap = Math.min(-balanceWithout(effectiveDebtorId), balanceWithout(effectiveCreditorId))

  const onSubmit: SubmitHandler<CreatePaybackFormInput> = async values => {
    if (!group || !payback) return
    try {
      applyGroup(
        await client.update(group.id, payback.id, {
          debtorId: effectiveDebtorId,
          creditorId: effectiveCreditorId,
          amount: centsFromEuros(values.amount)
        })
      )
      setError('')
      onCancel?.()
    } catch (error) {
      setError(errorMessage(error, 'Impossible de modifier le Règlement'))
    }
  }

  if (!group || !payback) return null

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
      mode="edit"
      onCancel={() => {
        form.reset()
        onCancel?.()
      }}
    />
  )
}
