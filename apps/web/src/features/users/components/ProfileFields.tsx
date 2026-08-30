import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import { Alert, Button, FormWrapper, Input } from '~ui'
import type { UpdateNameInput } from '../schemas'

type Props = {
  form: UseFormReturn<UpdateNameInput>
  error: string
  saved: boolean
  onSubmit: SubmitHandler<UpdateNameInput>
}

export const ProfileFields = ({ form, error, saved, onSubmit }: Props) => {
  const nameError = form.formState.errors.name?.message

  return (
    <form
      className="flex flex-col gap-3"
      aria-label="Modifier mon nom"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      {error ? <Alert message={error} /> : null}
      {saved && !form.formState.isDirty ? (
        <p className="text-sm text-positive" role="status">
          Nom modifié
        </p>
      ) : null}
      <h3 className="font-medium">Modifier mon nom</h3>
      <FormWrapper label="Nom" error={nameError}>
        <Input {...form.register('name')} required />
      </FormWrapper>
      <Button type="submit">Enregistrer</Button>
    </form>
  )
}
