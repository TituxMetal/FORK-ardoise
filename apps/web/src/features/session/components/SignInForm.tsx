import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authClient } from '../api'
import { signInSchema, type SignInFormInput } from '../schemas'
import { SignInFields } from './SignInFields'

export const SignInForm = () => {
  const [error, setError] = useState('')
  const form = useForm<SignInFormInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' }
  })

  const onSubmit: SubmitHandler<SignInFormInput> = async values => {
    const { error } = await authClient.signIn.email(values)
    setError(error?.message ?? '')
  }

  return <SignInFields form={form} error={error} onSubmit={onSubmit} />
}
