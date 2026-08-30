import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authClient } from '../api'
import { signUpSchema, type SignUpFormInput } from '../schemas'
import { SignUpFields } from './SignUpFields'

export const SignUpForm = () => {
  const [error, setError] = useState('')
  const form = useForm<SignUpFormInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' }
  })

  const onSubmit: SubmitHandler<SignUpFormInput> = async values => {
    const { error } = await authClient.signUp.email(values)
    setError(error?.message ?? '')
  }

  return <SignUpFields form={form} error={error} onSubmit={onSubmit} />
}
