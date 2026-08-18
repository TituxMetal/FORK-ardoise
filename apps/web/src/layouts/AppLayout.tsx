import type { ReactNode } from 'react'
import { authClient } from '../lib/authClient.ts'

type Props = {
  session: { name: string } | null
  children: ReactNode
}

export const AppLayout = ({ session, children }: Props) => {
  const signOut = async () => {
    await authClient.signOut()
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Ardoise</h1>
      {session ? (
        <section className="space-y-4">
          <p>Session ouverte : {session.name}</p>
          <button
            type="button"
            className="rounded bg-zinc-100 px-3 py-2 text-zinc-900"
            onClick={() => void signOut()}
          >
            Fermer la session
          </button>
        </section>
      ) : null}
      {children}
    </main>
  )
}
