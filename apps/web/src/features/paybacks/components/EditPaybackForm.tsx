import { useState } from 'react'
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form'
import { useStore } from '@nanostores/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { centsFromEuros, eurosFromCents } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { $group, applyGroup } from '~features/groups'
import { paybacksClient } from '../api'
import { enforcePaybackCap, paybackFieldsSchema, type CreatePaybackFormInput } from '../schemas'
import type { PaybacksClient } from '../types'
import { paybackCap, paybackCreditors } from '../utils'
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
    resolver: zodResolver(paybackFieldsSchema),
    defaultValues: payback
      ? {
          debtorId: payback.debtorId,
          creditorId: payback.creditorId,
          amount: eurosFromCents(payback.amount),
          day: payback.day
        }
      : { debtorId: '', creditorId: '', amount: '', day: '' }
  })
  const debtorId = useWatch({ control: form.control, name: 'debtorId' })
  const creditorId = useWatch({ control: form.control, name: 'creditorId' })

  const members = group?.members ?? []
  const balances = group?.balances ?? []
  // The Slate Balances include the payback being edited; the cap and the
  // creditor list are re-derived without it, so a payback at the cap stays
  // editable. Create passes null and reads the raw Balances.
  const creditors = paybackCreditors(balances, payback ?? null)
  const effectiveDebtorId = members.some(member => member.userId === debtorId)
    ? debtorId
    : (payback?.debtorId ?? members[0]?.userId ?? '')
  const effectiveCreditorId = creditors.some(balance => balance.userId === creditorId)
    ? creditorId
    : (payback?.creditorId ?? creditors[0]?.userId ?? '')
  const cap = paybackCap(balances, payback ?? null, effectiveDebtorId, effectiveCreditorId)

  const onSubmit: SubmitHandler<CreatePaybackFormInput> = async values => {
    if (!group || !payback) return
    if (enforcePaybackCap(form, cap, values)) return
    try {
      applyGroup(
        await client.update(group.id, payback.id, {
          debtorId: effectiveDebtorId,
          creditorId: effectiveCreditorId,
          day: values.day,
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
