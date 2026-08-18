import { useState, type FormEvent } from 'react'
import { authClient } from '../../lib/authClient.ts'
import { field } from '../../lib/forms.ts'

export const SessionForms = () => {
  const [error, setError] = useState('')

  const signUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const { error } = await authClient.signUp.email({
      email: field(form, 'email'),
      password: field(form, 'password'),
      name: field(form, 'name')
    })
    setError(error?.message ?? '')
  }

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
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
      {error ? (
        <p className="text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <form className="flex flex-col gap-3" onSubmit={signUp}>
        <h2 className="text-lg font-medium">Créer un User</h2>
        <label className="flex flex-col gap-1">
          Nom affiché
          <input
            className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
            name="name"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          E-mail
          <input
            className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
            name="email"
            type="email"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          Mot de passe
          <input
            className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
            name="password"
            type="password"
            required
            minLength={8}
          />
        </label>
        <button className="rounded bg-zinc-100 px-3 py-2 text-zinc-900" type="submit">
          Créer le User
        </button>
      </form>
      <form className="flex flex-col gap-3" onSubmit={signIn}>
        <h2 className="text-lg font-medium">Ouvrir une session</h2>
        <label className="flex flex-col gap-1">
          E-mail
          <input
            className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
            name="email"
            type="email"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          Mot de passe
          <input
            className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1"
            name="password"
            type="password"
            required
          />
        </label>
        <button className="rounded bg-zinc-100 px-3 py-2 text-zinc-900" type="submit">
          Ouvrir la session
        </button>
      </form>
    </div>
  )
}
