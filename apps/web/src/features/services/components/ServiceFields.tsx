import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import { Alert, Button, FormWrapper, Input, Select } from '~ui'
import type { Group } from '~features/groups'
import type { CreateServiceFormInput } from '../schemas'

type Props = {
  form: UseFormReturn<CreateServiceFormInput>
  error: string
  onSubmit: SubmitHandler<CreateServiceFormInput>
  members: Group['members']
  onCancel: () => void
}

export const ServiceFields = ({ form, error, onSubmit, members, onCancel }: Props) => {
  const labelError = form.formState.errors.label?.message
  const dayError = form.formState.errors.day?.message
  const amountError = form.formState.errors.amount?.message
  const providerError = form.formState.errors.providerId?.message
  const participantsError = form.formState.errors.participantIds?.message

  return (
    <form
      className="flex flex-col gap-3"
      aria-label="Constater un Service"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      {error ? <Alert message={error} /> : null}
      <h3 className="font-medium">Constater un Service</h3>
      <FormWrapper label="Libellé" error={labelError}>
        <Input {...form.register('label')} required />
      </FormWrapper>
      <FormWrapper label="Jour" error={dayError}>
        <Input {...form.register('day')} required placeholder="YYYY-MM-DD" />
      </FormWrapper>
      <FormWrapper label="Montant" error={amountError}>
        <Input {...form.register('amount')} required />
      </FormWrapper>
      <FormWrapper label="Prestataire" error={providerError}>
        <Select {...form.register('providerId')} required>
          {members.map(member => (
            <option key={member.userId} value={member.userId}>
              {member.name}
            </option>
          ))}
        </Select>
      </FormWrapper>
      <fieldset className="flex flex-col gap-1">
        <legend>Participants</legend>
        {members.map(member => (
          <label key={member.userId} className="flex items-center gap-2">
            <input
              type="checkbox"
              value={member.userId}
              defaultChecked
              {...form.register('participantIds')}
            />
            {member.name}
          </label>
        ))}
        {participantsError ? (
          <p className="text-sm text-negative" role="alert">
            {participantsError}
          </p>
        ) : null}
      </fieldset>
      <Button type="submit">Constater le Service</Button>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Annuler
      </Button>
    </form>
  )
}
