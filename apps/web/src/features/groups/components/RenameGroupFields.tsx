import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import { Alert, Button, FormWrapper, Input } from '~ui'
import type { RenameGroupInput } from '../schemas'

type Props = {
  form: UseFormReturn<RenameGroupInput>
  error: string
  onSubmit: SubmitHandler<RenameGroupInput>
  onCancel: () => void
}

export const RenameGroupFields = ({ form, error, onSubmit, onCancel }: Props) => {
  const nameError = form.formState.errors.name?.message

  return (
    <form
      className="flex flex-col gap-3"
      aria-label="Renommer le Groupe"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      {error ? <Alert message={error} /> : null}
      <h3 className="font-medium">Renommer le Groupe</h3>
      <FormWrapper label="Nom" error={nameError}>
        <Input {...form.register('name')} required autoFocus />
      </FormWrapper>
      <div className="flex gap-2">
        <Button type="submit">Enregistrer</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
