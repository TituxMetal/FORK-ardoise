import type { ReactNode } from 'react'
import { Button } from '~ui'
import { authClient } from '~features/session'
import { Link, type Route } from '~/lib/router'

type Props = {
  session: { name: string } | null
  currentRoute: Route['name']
  children: ReactNode
}

type Destination = {
  label: string
  to: string
  active: readonly Route['name'][]
}

const DESTINATIONS: Destination[] = [
  { label: 'Mes groupes', to: '/', active: ['groups', 'group'] },
  { label: 'Profil', to: '/profile', active: ['profile'] }
]

export const AppLayout = ({ session, currentRoute, children }: Props) => {
  const signOut = async () => {
    await authClient.signOut()
  }

  const showShell = session !== null && currentRoute !== 'invite'

  if (!showShell) {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Ardoise</h1>
        {children}
      </main>
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border p-3 md:flex">
        <Link
          to="/"
          className="mb-4 flex h-10 items-center rounded-md px-2 text-sm text-dim hover:bg-surface"
        >
          Ardoise
        </Link>
        <nav aria-label="Navigation principale" className="flex flex-col gap-1">
          {DESTINATIONS.map(destination => (
            <Link
              key={destination.label}
              to={destination.to}
              aria-current={destination.active.includes(currentRoute) ? 'page' : undefined}
              className={`flex h-10 items-center rounded-md px-3 text-sm font-medium ${
                destination.active.includes(currentRoute)
                  ? 'bg-surface text-foreground'
                  : 'text-dim hover:bg-surface/60 hover:text-foreground'
              }`}
            >
              {destination.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t border-border pt-3">
          <p className="text-sm text-dim">Session ouverte : {session.name}</p>
          <Button type="button" onClick={() => void signOut()}>
            Fermer la session
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <section
          aria-label="Session"
          className="flex items-center justify-between gap-2 border-b border-border px-4 py-2 md:hidden"
        >
          <p className="truncate text-sm text-dim">Session ouverte : {session.name}</p>
          <Button type="button" onClick={() => void signOut()}>
            Fermer la session
          </Button>
        </section>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-12 md:pt-8">
          <h1 className="sr-only">Ardoise</h1>
          {children}
        </main>
        <nav
          aria-label="Navigation principale"
          className="sticky bottom-0 z-20 flex border-t border-border bg-background px-4 pb-2 pt-2 md:hidden"
        >
          {DESTINATIONS.map((destination, index) => (
            <Link
              key={destination.label}
              to={destination.to}
              aria-current={destination.active.includes(currentRoute) ? 'page' : undefined}
              className={`flex h-12 flex-1 items-center justify-center text-sm font-medium ${
                index > 0 ? 'border-l border-border ' : ''
              }${
                destination.active.includes(currentRoute)
                  ? 'text-foreground'
                  : 'text-dim hover:text-foreground'
              }`}
            >
              {destination.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
