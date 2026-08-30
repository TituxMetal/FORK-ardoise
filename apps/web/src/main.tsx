import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppLayout } from '~/layouts/AppLayout'
import { authClient } from '~features/session'
import { useRoute } from '~/lib/router'
import { AuthPage } from '~/pages/AuthPage'
import { GroupsPage } from '~/pages/GroupsPage'
import { GroupPage } from '~/pages/GroupPage'
import { InvitePage } from '~/pages/InvitePage'
import { ProfilePage } from '~/pages/ProfilePage'
import '~/index.css'

const App = () => {
  const route = useRoute()
  const { data: session, isPending, refetch } = authClient.useSession()

  if (route === null || isPending) {
    return (
      <AppLayout session={null}>
        <p>Chargement…</p>
      </AppLayout>
    )
  }

  const page =
    route.name === 'invite' ? (
      <InvitePage secret={route.secret} session={session ? { name: session.user.name } : null} />
    ) : route.name === 'auth' ? (
      session ? (
        <GroupsPage />
      ) : (
        <AuthPage />
      )
    ) : session === null ? (
      <AuthPage />
    ) : route.name === 'group' ? (
      <GroupPage id={route.id} />
    ) : route.name === 'profile' ? (
      <ProfilePage session={{ name: session.user.name }} onRenamed={() => void refetch()} />
    ) : (
      <GroupsPage />
    )

  return <AppLayout session={session ? { name: session.user.name } : null}>{page}</AppLayout>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
