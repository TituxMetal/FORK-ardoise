import { authClient } from '../infrastructure/CreateAuth.client.ts'
import { GroupesScreen } from './GroupesScreen.tsx'
import { SessionForms } from './SessionForms.tsx'

export const AuthScreen = () => {
  const { data: session, isPending } = authClient.useSession()

  const signOut = async () => {
    await authClient.signOut()
  }

  if (isPending) {
    return <p>Chargement…</p>
  }

  if (session) {
    return (
      <section className="space-y-4">
        <p>Session ouverte : {session.user.name}</p>
        <button
          type="button"
          className="rounded bg-zinc-100 px-3 py-2 text-zinc-900"
          onClick={signOut}
        >
          Fermer la session
        </button>
        <GroupesScreen />
      </section>
    )
  }

  return <SessionForms />
}
