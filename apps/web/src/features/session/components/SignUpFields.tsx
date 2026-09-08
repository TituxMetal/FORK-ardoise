import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import { Alert, Button, FormWrapper, Input } from '~ui'
import type { SignUpFormInput } from '../schemas'

type Props = {
  form: UseFormReturn<SignUpFormInput>
  error: string
  onSubmit: SubmitHandler<SignUpFormInput>
}

export const SignUpFields = ({ form, error, onSubmit }: Props) => {
  const nameError = form.formState.errors.name?.message
  const emailError = form.formState.errors.email?.message
  const passwordError = form.formState.errors.password?.message

  return (
    <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {error ? <Alert message={error} /> : null}
      <h2 className="text-lg font-medium">Créer un compte</h2>
      <FormWrapper label="Nom affiché" error={nameError}>
        <Input {...form.register('name')} placeholder="Léa" required />
      </FormWrapper>
      <FormWrapper label="E-mail" error={emailError}>
        <Input {...form.register('email')} type="email" placeholder="lea@example.com" required />
      </FormWrapper>
      <FormWrapper label="Mot de passe" error={passwordError}>
        <Input {...form.register('password')} type="password" required minLength={8} />
      </FormWrapper>
      <Button type="submit" className="w-full">
        Créer le compte
      </Button>
    </form>
  )
}
