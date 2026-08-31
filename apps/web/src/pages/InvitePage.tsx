import { useEffect, useState } from 'react'
import { Alert, Button } from '~ui'
import { groupsClient, type Group, type GroupsClient, type InvitePreview } from '~features/groups'
import { errorMessage } from '~/lib/errorMessage'
import { SessionForms } from '~features/session'

type Props = {
  secret: string
  session: { name: string } | null
  client?: GroupsClient
}

export const InvitePage = ({ secret, session, client = groupsClient }: Props) => {
  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    setError('')
    setGroup(null)
    void client
      .preview(secret)
      .then(setPreview)
      .catch((error: unknown) => setError(errorMessage(error, 'Invitation introuvable')))
  }, [client, secret])

  const join = async () => {
    setJoining(true)
    setError('')
    try {
      setGroup(await client.join(secret))
    } catch (error) {
      setError(errorMessage(error, 'Invitation introuvable'))
    } finally {
      setJoining(false)
    }
  }

  if (!preview && !error) {
    return <p>Chargement…</p>
  }

  if (error && !preview) {
    return (
      <p className="text-negative" role="alert">
        {error}
      </p>
    )
  }

  const memberCountLabel = preview
    ? preview.memberCount === 1
      ? '1 membre'
      : `${preview.memberCount} membres`
    : ''

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Invitation</h2>
      {preview ? (
        <article className="space-y-1 rounded-lg border border-border bg-surface p-4">
          <p className="font-semibold">{preview.name}</p>
          <p className="text-dim">{memberCountLabel}</p>
        </article>
      ) : null}
      {error ? <Alert message={error} /> : null}
      {group ? (
        <ul className="space-y-1">
          {group.members.map(member => (
            <li key={member.userId}>{member.name}</li>
          ))}
        </ul>
      ) : session ? (
        <Button type="button" onClick={() => void join()} disabled={joining}>
          Rejoindre le Groupe
        </Button>
      ) : (
        <SessionForms />
      )}
    </section>
  )
}
