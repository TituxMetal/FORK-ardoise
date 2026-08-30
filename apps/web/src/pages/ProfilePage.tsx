import { ProfileForm, type UsersClient } from '~features/users'

type Props = {
  session: { name: string }
  users?: UsersClient
  onRenamed?: (name: string) => void
}

export const ProfilePage = ({ session, users, onRenamed }: Props) => (
  <section className="space-y-4">
    <h2 className="text-lg font-medium">Profil</h2>
    <ProfileForm initialName={session.name} client={users} onRenamed={onRenamed} />
  </section>
)
