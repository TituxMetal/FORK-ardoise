import type { ReactNode } from 'react'
import { Button } from '~ui'
import { authClient } from '~features/session'
import { Link } from '~/lib/router'

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
          <div className="flex flex-wrap gap-2">
            <Link
              to="/profile"
              className="inline-flex h-11 items-center rounded-lg bg-surface px-3 text-dim hover:bg-surface-2 hover:text-foreground"
            >
              Profil
            </Link>
            <Button type="button" onClick={() => void signOut()}>
              Fermer la session
            </Button>
          </div>
        </section>
      ) : null}
      {children}
    </main>
  )
}
