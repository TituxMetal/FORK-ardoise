import { useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { Alert, Button } from '~ui'
import { BackIcon } from '~/components/icons'
import { Expenses } from '~features/expenses'
import { $error, $group, groupsClient, loadGroup, type GroupsClient } from '~features/groups'
import { Paybacks } from '~features/paybacks'
import { Services } from '~features/services'
import { Link } from '~/lib/router'

type Props = {
  id: string
  groups?: GroupsClient
  copy?: (text: string) => Promise<void>
}

export const GroupPage = ({
  id,
  groups = groupsClient,
  copy = text => navigator.clipboard.writeText(text)
}: Props) => {
  const group = useStore($group)
  const error = useStore($error)

  useEffect(() => {
    void loadGroup(groups, id)
  }, [groups, id])

  useEffect(() => {
    const onFocus = () => void loadGroup(groups, id)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [groups, id])

  return (
    <section className="space-y-4">
      <Link
        to="/"
        className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-surface px-3 text-dim hover:bg-surface-2 hover:text-foreground"
      >
        <BackIcon />
        Retour aux Groupes
      </Link>
      {error ? <Alert message={error} /> : null}
      {group ? (
        <article className="space-y-4">
          <h2 className="text-lg font-medium">{group.name}</h2>
          <Button
            type="button"
            onClick={() => void copy(`${window.location.origin}/invites/${group.invite.secret}`)}
          >
            Copier le lien d’Invitation
          </Button>
          <Expenses />
          <Services />
          <Paybacks />
        </article>
      ) : error ? null : (
        <p>Chargement…</p>
      )}
    </section>
  )
}
