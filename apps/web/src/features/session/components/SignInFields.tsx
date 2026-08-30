import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import { Alert, Button, FormWrapper, Input } from '~ui'
import type { SignInFormInput } from '../schemas'

type Props = {
  form: UseFormReturn<SignInFormInput>
  error: string
  onSubmit: SubmitHandler<SignInFormInput>
}

export const SignInFields = ({ form, error, onSubmit }: Props) => {
  const emailError = form.formState.errors.email?.message
  const passwordError = form.formState.errors.password?.message

  return (
    <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {error ? <Alert message={error} /> : null}
      <h2 className="text-lg font-medium">Ouvrir une session</h2>
      <FormWrapper label="E-mail" error={emailError}>
        <Input {...form.register('email')} type="email" required />
      </FormWrapper>
      <FormWrapper label="Mot de passe" error={passwordError}>
        <Input {...form.register('password')} type="password" required />
      </FormWrapper>
      <Button type="submit">Ouvrir la session</Button>
    </form>
  )
}
