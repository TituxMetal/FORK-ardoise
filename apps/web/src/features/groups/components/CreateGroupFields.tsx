import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import { Alert, Button, FormWrapper, Input } from '~ui'
import type { CreateGroupInput } from '../schemas'

type Props = {
  form: UseFormReturn<CreateGroupInput>
  error: string
  onSubmit: SubmitHandler<CreateGroupInput>
}

export const CreateGroupFields = ({ form, error, onSubmit }: Props) => {
  const nameError = form.formState.errors.name?.message

  return (
    <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {error ? <Alert message={error} /> : null}
      <h2 className="text-lg font-medium">Créer un Groupe</h2>
      <FormWrapper label="Nom" error={nameError}>
        <Input {...form.register('name')} />
      </FormWrapper>
      <Button type="submit">Créer le Groupe</Button>
    </form>
  )
}
