import { useState, type SubmitEventHandler } from 'react'
import { useStore } from '@nanostores/react'
import { Alert, Button, FormWrapper, Input, Select } from '~ui'
import { centsFromEuros, euros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { field } from '~/lib/forms'
import { $group, applyGroup } from '~features/groups'
import { paybacksClient } from '../api'
import type { PaybacksClient } from '../types'

type Props = {
  client?: PaybacksClient
}

export const Paybacks = ({ client = paybacksClient }: Props) => {
  const group = useStore($group)
  const [error, setError] = useState('')
  const [debtorId, setDebtorId] = useState('')
  const [creditorId, setCreditorId] = useState('')

  const createPayback: SubmitEventHandler<HTMLFormElement> = async event => {
    event.preventDefault()
    if (!group) return
    const form = new FormData(event.currentTarget)
    event.currentTarget.reset()
    try {
      applyGroup(
        await client.create(group.id, {
          debtorId: field(form, 'debtorId'),
          creditorId: field(form, 'creditorId'),
          amount: centsFromEuros(field(form, 'amount'))
        })
      )
      setError('')
    } catch (error) {
      setError(errorMessage(error, 'Impossible de constater le Règlement'))
    }
  }

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

  const creditors = group.balances
    .filter(balance => balance.amount > 0)
    .sort((a, b) => b.amount - a.amount)
  const selectedDebtorId = group.members.some(member => member.userId === debtorId)
    ? debtorId
    : (group.balances.find(balance => balance.amount < 0)?.userId ?? group.members[0]?.userId ?? '')
  const selectedCreditorId = creditors.some(balance => balance.userId === creditorId)
    ? creditorId
    : (creditors[0]?.userId ?? '')
  const nameOf = (userId: string) =>
    group.members.find(member => member.userId === userId)?.name ?? userId
  const cap = Math.min(
    -(group.balances.find(balance => balance.userId === selectedDebtorId)?.amount ?? 0),
    group.balances.find(balance => balance.userId === selectedCreditorId)?.amount ?? 0
  )

  return (
    <>
      {error ? <Alert message={error} /> : null}
      <form
        className="flex flex-col gap-3"
        aria-label="Constater un Règlement"
        onSubmit={createPayback}
      >
        <h3 className="font-medium">Qui doit quoi</h3>
        <FormWrapper label="Débiteur">
          <Select
            name="debtorId"
            required
            value={selectedDebtorId}
            onChange={event => setDebtorId(event.target.value)}
          >
            {group.members.map(member => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </Select>
        </FormWrapper>
        <FormWrapper label="Créancier">
          <Select
            name="creditorId"
            required
            value={selectedCreditorId}
            onChange={event => setCreditorId(event.target.value)}
          >
            {creditors.map(balance => (
              <option key={balance.userId} value={balance.userId}>
                {balance.name}
              </option>
            ))}
          </Select>
        </FormWrapper>
        <p>Plafond {euros(cap)}</p>
        <FormWrapper label="Montant">
          <Input name="amount" required />
        </FormWrapper>
        <Button type="submit">Constater le Règlement</Button>
      </form>
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
