import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import { SlateEntryFields, type Group } from '~features/groups'
import type { CreateExpenseFormInput } from '../schemas'

type Props = {
  form: UseFormReturn<CreateExpenseFormInput>
  error: string
  onSubmit: SubmitHandler<CreateExpenseFormInput>
  members: Group['members']
  onCancel: () => void
  mode?: 'create' | 'edit'
}

export const ExpenseFields = (props: Props) => (
  <SlateEntryFields
    {...props}
    subjectField="payerId"
    subjectLabel="Payeur"
    noun="Dépense"
    article="une"
    definiteArticle="la"
  />
)
