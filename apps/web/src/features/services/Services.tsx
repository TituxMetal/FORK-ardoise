import { useState, type FormEvent } from 'react'
import { centsFromEuros, euros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { field } from '~/lib/forms'
import { groupsClient, type GroupDto, type GroupsClient } from '~features/groups/api/groups.client'

type Props = {
  group: GroupDto
  client?: GroupsClient
  onChange: (group: GroupDto) => void
}

export const Services = ({ group, client = groupsClient, onChange }: Props) => {
  const [error, setError] = useState('')

  const createService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const selected = form.getAll('participantIds').filter(value => typeof value === 'string')
    event.currentTarget.reset()
    try {
      onChange(
        await client.createService(group.id, {
          label: field(form, 'label'),
          day: field(form, 'day'),
          amount: centsFromEuros(field(form, 'amount')),
          providerId: field(form, 'providerId'),
          participantIds: selected.length > 0 ? selected : undefined
        })
      )
      setError('')
    } catch (error) {
      setError(errorMessage(error, 'Impossible de constater le Service'))
    }
  }

  const deleteService = async (serviceId: string) => {
    try {
      onChange(await client.deleteService(group.id, serviceId))
      setError('')
    } catch (error) {
      setError(errorMessage(error, 'Service introuvable'))
    }
  }

  return (
    <>
      {error ? (
        <p className="text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <form
        className="flex flex-col gap-3"
        aria-label="Constater un Service"
        onSubmit={createService}
      >
        <h3 className="font-medium">Constater un Service</h3>
        <label className="flex flex-col gap-1">
          Libellé
          <input
            name="label"
            required
            className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Jour
          <input
            name="day"
            required
            placeholder="YYYY-MM-DD"
            className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Montant
          <input
            name="amount"
            required
            className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Prestataire
          <select
            name="providerId"
            required
            defaultValue={group.members[0]?.userId}
            className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
          >
            {group.members.map(member => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex flex-col gap-1">
          <legend>Participants</legend>
          {group.members.map(member => (
            <label key={member.userId} className="flex items-center gap-2">
              <input type="checkbox" name="participantIds" value={member.userId} defaultChecked />
              {member.name}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="rounded bg-zinc-100 px-3 py-2 text-zinc-900">
          Constater le Service
        </button>
      </form>
      {group.services.length === 0 ? (
        <p>Aucun Service</p>
      ) : (
        <ul className="space-y-2">
          {group.services.map(service => (
            <li key={service.id} className="space-y-1">
              <p>{service.label}</p>
              <p>{service.day}</p>
              <p>{euros(service.amount)}</p>
              <button
                type="button"
                className="rounded bg-zinc-800 px-3 py-2"
                onClick={() => void deleteService(service.id)}
              >
                Supprimer {service.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
