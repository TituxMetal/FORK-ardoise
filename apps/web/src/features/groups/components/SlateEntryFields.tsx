import type { Path, SubmitHandler, UseFormReturn } from 'react-hook-form'
import { Alert, Button, FormWrapper, Input, Select } from '~ui'
import type { Group } from '../types'

/**
 * The shared Expense/Service form body. The two vocabularies differ only in
 * the subject field (payer vs provider) and the noun used in the copy; this
 * component renders the common Libellé / Jour / Montant / subject / participants
 * shape once. Each feature's fields shell supplies its schema-bound labels.
 */
type SlateEntryFieldsInput<TSubject extends 'payerId' | 'providerId'> = {
  label: string
  day: string
  amount: string
  participantIds: string[]
} & Record<TSubject, string>

type SlateEntryFieldsProps<TSubject extends 'payerId' | 'providerId'> = {
  form: UseFormReturn<SlateEntryFieldsInput<TSubject>>
  error: string
  onSubmit: SubmitHandler<SlateEntryFieldsInput<TSubject>>
  members: Group['members']
  onCancel: () => void
  mode?: 'create' | 'edit'
  /** The form key for the subject select, e.g. `payerId` or `providerId`. */
  subjectField: TSubject
  /** The select label for the subject, e.g. "Payeur" or "Prestataire". */
  subjectLabel: string
  /** Copy noun, e.g. "Dépense" or "Service", used in the title and submit. */
  noun: string
  /** Indefinite article for the noun, e.g. "une" (Dépense) or "un" (Service). */
  article: 'une' | 'un'
  /** Definite article for the noun's submit copy, e.g. "la" (Dépense) or "le" (Service). */
  definiteArticle: 'la' | 'le'
}

export const SlateEntryFields = <TSubject extends 'payerId' | 'providerId'>({
  form,
  error,
  onSubmit,
  members,
  onCancel,
  mode = 'create',
  subjectField,
  subjectLabel,
  noun,
  article,
  definiteArticle
}: SlateEntryFieldsProps<TSubject>) => {
  const labelError = form.formState.errors.label?.message as string | undefined
  const dayError = form.formState.errors.day?.message as string | undefined
  const amountError = form.formState.errors.amount?.message as string | undefined
  const subjectError = form.formState.errors[subjectField]?.message as string | undefined
  const participantsError = form.formState.errors.participantIds?.message as string | undefined
  const title = mode === 'edit' ? `Modifier ${article} ${noun}` : `Constater ${article} ${noun}`
  const submitLabel = mode === 'edit' ? 'Enregistrer' : `Constater ${definiteArticle} ${noun}`
  // The two vocabularies' inputs share these field names; cast the concrete
  // paths once here so the shared body stays typed against the generic input.
  const register = (name: 'label' | 'day' | 'amount' | 'participantIds' | TSubject) =>
    form.register(name as Path<SlateEntryFieldsInput<TSubject>>)
  const participantsValue = form.getValues(
    'participantIds' as Path<SlateEntryFieldsInput<TSubject>>
  ) as string[] | undefined

  return (
    <form
      className="flex flex-col gap-3"
      aria-label={title}
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      {error ? <Alert message={error} /> : null}
      <h3 className="font-medium">{title}</h3>
      <FormWrapper label="Libellé" error={labelError}>
        <Input {...register('label')} required autoFocus={mode === 'edit'} />
      </FormWrapper>
      <FormWrapper label="Jour" error={dayError}>
        <Input {...register('day')} required placeholder="YYYY-MM-DD" />
      </FormWrapper>
      <FormWrapper label="Montant" error={amountError}>
        <Input {...register('amount')} required />
      </FormWrapper>
      <FormWrapper label={subjectLabel} error={subjectError}>
        <Select {...register(subjectField)} required>
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
              defaultChecked={participantsValue?.includes(member.userId)}
              {...register('participantIds')}
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
      <Button type="submit">{submitLabel}</Button>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Annuler
      </Button>
    </form>
  )
}
