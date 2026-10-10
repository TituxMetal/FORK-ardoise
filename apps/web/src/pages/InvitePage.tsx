import { useEffect, useState } from 'react'
import { Alert, Button } from '~ui'
import { groupsClient, type GroupsClient, type InvitePreview } from '~features/groups'
import { errorMessage } from '~/lib/errorMessage'
import { Link, navigate } from '~/lib/router'
import { SessionForms } from '~features/session'

type Props = {
  secret: string
  session: { name: string } | null
  client?: GroupsClient
}

export const InvitePage = ({ secret, session, client = groupsClient }: Props) => {
  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    setError('')
    void client
      .preview(secret)
      .then(setPreview)
      .catch((error: unknown) => setError(errorMessage(error, 'Invitation introuvable')))
  }, [client, secret])

  const join = async () => {
    setJoining(true)
    setError('')
    try {
      const joined = await client.join(secret)
      navigate(`/groups/${joined.id}`)
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
      {preview ? (
        <div className="space-y-3">
          <p className="text-dim">
            « {preview.name} » est une ardoise partagée : les Soldes découlent de ce que le Groupe
            enregistre, jamais d’une saisie à la main.
          </p>
          <Link
            to="/about"
            className="inline-flex h-11 items-center rounded-md px-3 text-sm font-medium text-dim hover:text-foreground"
          >
            À propos
          </Link>
        </div>
      ) : null}
      {session ? (
        <Button type="button" onClick={() => void join()} disabled={joining}>
          Rejoindre le Groupe
        </Button>
      ) : (
        <SessionForms />
      )}
    </section>
  )
}
