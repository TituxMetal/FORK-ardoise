import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { Alert, Button } from '~ui'
import { euros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { $group, applyGroup } from '~features/groups'
import { paybacksClient } from '../api'
import type { PaybacksClient } from '../types'
import { PaybackForm } from './PaybackForm'

type Props = {
  client?: PaybacksClient
}

export const Paybacks = ({ client = paybacksClient }: Props) => {
  const group = useStore($group)
  const [error, setError] = useState('')

  const deletePayback = async (paybackId: string) => {
    if (!group) return
    try {
      applyGroup(await client.delete(group.id, paybackId))
      setError('')
    } catch (error) {
      setError(errorMessage(error, 'Règlement introuvable'))
    }
  }

  if (!group) return null

  const nameOf = (userId: string) =>
    group.members.find(member => member.userId === userId)?.name ?? userId

  return (
    <>
      {error ? <Alert message={error} /> : null}
      <PaybackForm client={client} />
      {group.paybacks.length === 0 ? (
        <p>Aucun Règlement</p>
      ) : (
        <ul className="space-y-2">
          {group.paybacks.map(payback => (
            <li key={payback.id} className="space-y-1">
              <p>
                {nameOf(payback.debtorId)} → {nameOf(payback.creditorId)} {euros(payback.amount)}
              </p>
              <Button
                variant="secondary"
                type="button"
                onClick={() => void deletePayback(payback.id)}
              >
                Supprimer le Règlement {nameOf(payback.debtorId)} → {nameOf(payback.creditorId)}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <ul>
        {group.balances.map(balance => (
          <li key={balance.userId}>
            {balance.name} {euros(balance.amount)}
          </li>
        ))}
      </ul>
    </>
  )
}
