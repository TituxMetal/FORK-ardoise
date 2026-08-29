import type { ReactNode } from 'react'
import { Button } from '~ui/index'
import { authClient } from '~features/session/api'

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
          <Button type="button" onClick={() => void signOut()}>
            Fermer la session
          </Button>
        </section>
      ) : null}
      {children}
    </main>
  )
}
