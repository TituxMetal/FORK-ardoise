import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppLayout } from '~/layouts/AppLayout'
import { authClient } from '~features/session'
import { useRoute } from '~/lib/router'
import { AuthPage } from '~/pages/AuthPage'
import { GroupsPage } from '~/pages/GroupsPage'
import { GroupPage } from '~/pages/GroupPage'
import { InvitePage } from '~/pages/InvitePage'
import '~/index.css'

const App = () => {
  const route = useRoute()
  const { data: session, isPending } = authClient.useSession()

  if (route === null || isPending) {
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
