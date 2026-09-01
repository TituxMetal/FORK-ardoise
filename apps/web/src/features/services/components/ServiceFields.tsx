import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import { SlateEntryFields, type Group } from '~features/groups'
import type { CreateServiceFormInput } from '../schemas'

type Props = {
  form: UseFormReturn<CreateServiceFormInput>
  error: string
  onSubmit: SubmitHandler<CreateServiceFormInput>
  members: Group['members']
  onCancel: () => void
  mode?: 'create' | 'edit'
}

export const ServiceFields = (props: Props) => (
  <SlateEntryFields
    {...props}
    subjectField="providerId"
    subjectLabel="Prestataire"
    noun="Service"
    article="un"
    definiteArticle="le"
  />
)
