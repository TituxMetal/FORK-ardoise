import { useState, type SubmitEventHandler } from 'react'
import { Alert, Button, FormWrapper, Input } from '~ui'
import { authClient } from '../api'
import { field } from '~/lib/forms'

export const SessionForms = () => {
  const [error, setError] = useState('')

  const signUp: SubmitEventHandler<HTMLFormElement> = async event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const { error } = await authClient.signUp.email({
      email: field(form, 'email'),
      password: field(form, 'password'),
      name: field(form, 'name')
    })
    setError(error?.message ?? '')
  }

  const signIn: SubmitEventHandler<HTMLFormElement> = async event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const { error } = await authClient.signIn.email({
      email: field(form, 'email'),
      password: field(form, 'password')
    })
    setError(error?.message ?? '')
  }

  return (
    <div className="space-y-8">
      {error ? <Alert message={error} /> : null}
      <form className="flex flex-col gap-3" onSubmit={signUp}>
        <h2 className="text-lg font-medium">Créer un User</h2>
        <FormWrapper label="Nom affiché">
          <Input name="name" required />
        </FormWrapper>
        <FormWrapper label="E-mail">
          <Input name="email" type="email" required />
        </FormWrapper>
        <FormWrapper label="Mot de passe">
          <Input name="password" type="password" required minLength={8} />
        </FormWrapper>
        <Button type="submit">Créer le User</Button>
      </form>
      <form className="flex flex-col gap-3" onSubmit={signIn}>
        <h2 className="text-lg font-medium">Ouvrir une session</h2>
        <FormWrapper label="E-mail">
          <Input name="email" type="email" required />
        </FormWrapper>
        <FormWrapper label="Mot de passe">
          <Input name="password" type="password" required />
        </FormWrapper>
        <Button type="submit">Ouvrir la session</Button>
      </form>
    </div>
  )
}
