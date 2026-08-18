import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppLayout } from './layouts/AppLayout.tsx'
import { authClient } from './lib/authClient.ts'
import { useRoute } from './lib/router.tsx'
import { AuthPage } from './pages/AuthPage.tsx'
import { GroupsPage } from './pages/GroupsPage.tsx'
import { GroupPage } from './pages/GroupPage.tsx'
import { InvitePage } from './pages/InvitePage.tsx'
import './index.css'

const App = () => {
  const route = useRoute()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <AppLayout session={null}>
        <p>Chargement…</p>
      </AppLayout>
    )
  }

  const signedIn = session !== null
  const page =
    route.name === 'invite' ? (
      <InvitePage secret={route.secret} session={signedIn ? { name: session.user.name } : null} />
    ) : route.name === 'auth' ? (
      signedIn ? (
        <GroupsPage />
      ) : (
        <AuthPage />
      )
    ) : !signedIn ? (
      <AuthPage />
    ) : route.name === 'group' ? (
      <GroupPage id={route.id} />
    ) : (
      <GroupsPage />
    )

  return <AppLayout session={signedIn ? { name: session.user.name } : null}>{page}</AppLayout>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
