import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import { Alert, Button, FormWrapper, Input, Select } from '~ui'
import { euros } from '~/lib/amounts'
import type { Group } from '~features/groups'
import type { CreatePaybackFormInput } from '../schemas'

type Props = {
  form: UseFormReturn<CreatePaybackFormInput>
  error: string
  onSubmit: SubmitHandler<CreatePaybackFormInput>
  members: Group['members']
  creditors: Group['balances']
  debtorId: string
  creditorId: string
  cap: number
  onCancel: () => void
}

export const PaybackFields = ({
  form,
  error,
  onSubmit,
  members,
  creditors,
  debtorId,
  creditorId,
  cap,
  onCancel
}: Props) => {
  const amountError = form.formState.errors.amount?.message

  return (
    <form
      className="flex flex-col gap-3"
      aria-label="Constater un Règlement"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      {error ? <Alert message={error} /> : null}
      <h3 className="font-medium">Qui doit quoi</h3>
      <FormWrapper label="Débiteur">
        <Select
          value={debtorId}
          onChange={event => form.setValue('debtorId', event.target.value)}
          required
        >
          {members.map(member => (
            <option key={member.userId} value={member.userId}>
              {member.name}
            </option>
          ))}
        </Select>
      </FormWrapper>
      <FormWrapper label="Créancier">
        <Select
          value={creditorId}
          onChange={event => form.setValue('creditorId', event.target.value)}
          required
        >
          {creditors.map(balance => (
            <option key={balance.userId} value={balance.userId}>
              {balance.name}
            </option>
          ))}
        </Select>
      </FormWrapper>
      <p>Plafond {euros(cap)}</p>
      <FormWrapper label="Montant" error={amountError}>
        <Input {...form.register('amount')} required />
      </FormWrapper>
      <Button type="submit">Constater le Règlement</Button>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Annuler
      </Button>
    </form>
  )
}
