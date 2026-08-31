import { useStore } from '@nanostores/react'
import { $group, SlateEntryList } from '~features/groups'
import { dayLabel, initials } from '~/lib/format'
import { paybacksClient } from '../api'
import type { PaybacksClient } from '../types'
import { EditPaybackForm } from './EditPaybackForm'

type Props = {
  client?: PaybacksClient
}

export const Paybacks = ({ client = paybacksClient }: Props) => {
  const group = useStore($group)
  if (!group) return null
  const nameOf = (userId: string) =>
    group.members.find(member => member.userId === userId)?.name ?? userId
  const labelOf = (payback: { debtorId: string; creditorId: string }) =>
    `${nameOf(payback.debtorId)} → ${nameOf(payback.creditorId)}`
  return (
    <SlateEntryList
      kind="paybacks"
      entries={group.paybacks}
      emptyText="Aucun Règlement"
      notFoundMessage="Règlement introuvable"
      client={client}
      rowFor={payback => ({
        initials: initials(nameOf(payback.debtorId)),
        label: labelOf(payback),
        detail: `${nameOf(payback.debtorId)} · ${dayLabel(payback.day)}`,
        amount: payback.amount,
        confirmLabel: `Supprimer « ${labelOf(payback)} » ?`
      })}
      renderEditForm={(entryId, onCancel) => (
        <EditPaybackForm key={entryId} paybackId={entryId} client={client} onCancel={onCancel} />
      )}
    />
  )
}
