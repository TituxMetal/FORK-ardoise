import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppLayout } from '~/layouts/AppLayout'
import { authClient } from '~features/session'
import { useRoute } from '~/lib/router'
import { resolvePage } from '~/lib/resolvePage'
import { AuthPage } from '~/pages/AuthPage'
import { GroupsPage } from '~/pages/GroupsPage'
import { GroupPage } from '~/pages/GroupPage'
import { InvitePage } from '~/pages/InvitePage'
import { LandingPage } from '~/pages/LandingPage'
import { ProfilePage } from '~/pages/ProfilePage'
import '~/index.css'

const App = () => {
  const route = useRoute()
  const { data: session, isPending, refetch } = authClient.useSession()

  if (route === null || isPending) {
    return (
      <main className="mx-auto max-w-md space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Ardoise</h1>
        <p>Chargement…</p>
      </main>
    )
  }

  const member = session ? { name: session.user.name } : null
  const resolved = resolvePage(route, member)

  let page: ReactNode
  switch (resolved.name) {
    case 'landing':
      page = <LandingPage />
      break
    case 'auth':
      page = <AuthPage />
      break
    case 'groups':
      page = <GroupsPage />
      break
    case 'group':
      page = <GroupPage id={resolved.id} />
      break
    case 'invite':
      page = <InvitePage secret={resolved.secret} session={member} />
      break
    case 'profile':
      page = <ProfilePage session={member!} onRenamed={() => void refetch()} />
      break
  }

  return (
    <AppLayout session={member} currentRoute={resolved.name}>
      {page}
    </AppLayout>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
