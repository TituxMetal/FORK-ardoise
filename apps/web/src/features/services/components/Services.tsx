import { useState, type SubmitEventHandler } from 'react'
import { Alert, Button, FormWrapper, Input, Select } from '~ui/index'
import { centsFromEuros, euros } from '~/lib/amounts'
import { errorMessage } from '~/lib/errorMessage'
import { field } from '~/lib/forms'
import type { GroupDto } from '~features/groups/api'
import { servicesClient, type ServicesClient } from '~features/services/api'

type Props = {
  group: GroupDto
  client?: ServicesClient
  onChange: (group: GroupDto) => void
}

export const Services = ({ group, client = servicesClient, onChange }: Props) => {
  const [error, setError] = useState('')

  const createService: SubmitEventHandler<HTMLFormElement> = async event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const selected = form.getAll('participantIds').filter(value => typeof value === 'string')
    event.currentTarget.reset()
    try {
      onChange(
        await client.create(group.id, {
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
      onChange(await client.delete(group.id, serviceId))
      setError('')
    } catch (error) {
      setError(errorMessage(error, 'Service introuvable'))
    }
  }

  return (
    <>
      {error ? <Alert message={error} /> : null}
      <form
        className="flex flex-col gap-3"
        aria-label="Constater un Service"
        onSubmit={createService}
      >
        <h3 className="font-medium">Constater un Service</h3>
        <FormWrapper label="Libellé">
          <Input name="label" required />
        </FormWrapper>
        <FormWrapper label="Jour">
          <Input name="day" required placeholder="YYYY-MM-DD" />
        </FormWrapper>
        <FormWrapper label="Montant">
          <Input name="amount" required />
        </FormWrapper>
        <FormWrapper label="Prestataire">
          <Select name="providerId" required defaultValue={group.members[0]?.userId}>
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
        <Button type="submit">Constater le Service</Button>
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
              <Button
                variant="secondary"
                type="button"
                onClick={() => void deleteService(service.id)}
              >
                Supprimer {service.label}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
