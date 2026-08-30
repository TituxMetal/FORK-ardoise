import { useEffect, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { errorMessage } from '~/lib/errorMessage'
import {
  CreateGroupFields,
  GroupsList,
  createGroupSchema,
  groupsClient,
  renameGroupSchema,
  type CreateGroupInput,
  type GroupsClient,
  type GroupSummary,
  type RenameGroupInput
} from '~features/groups'

type Props = {
  client?: GroupsClient
}

export const GroupsPage = ({ client = groupsClient }: Props) => {
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [error, setError] = useState('')
  const [createError, setCreateError] = useState('')
  const [renameError, setRenameError] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [confirmingLeaveId, setConfirmingLeaveId] = useState<string | null>(null)

  const createForm = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: '' }
  })
  const renameForm = useForm<RenameGroupInput>({
    resolver: zodResolver(renameGroupSchema),
    defaultValues: { name: '' }
  })

  useEffect(() => {
    void client
      .list()
      .then(setGroups)
      .catch(() => setError('Impossible de lister les Groupes'))
  }, [client])

  const refresh = async () => {
    try {
      setGroups(await client.list())
      setError('')
    } catch {
      setError('Impossible de lister les Groupes')
    }
  }

  const onCreate: SubmitHandler<CreateGroupInput> = async ({ name }) => {
    try {
      await client.create(name)
      createForm.reset()
      setCreateError('')
      void refresh()
    } catch (error) {
      setCreateError(errorMessage(error, 'Impossible de créer le Groupe'))
    }
  }

  const startRename = (group: GroupSummary) => {
    renameForm.reset({ name: group.name })
    setRenameError('')
    setRenamingId(group.id)
    setConfirmingLeaveId(null)
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameError('')
  }

  const onRename: SubmitHandler<RenameGroupInput> = async ({ name }) => {
    if (renamingId === null) {
      return
    }
    try {
      await client.rename(renamingId, name)
      cancelRename()
      void refresh()
    } catch (error) {
      setRenameError(errorMessage(error, 'Impossible de renommer le Groupe'))
    }
  }

  const startLeave = (group: GroupSummary) => {
    setConfirmingLeaveId(group.id)
    setRenamingId(null)
    setRenameError('')
  }

  const cancelLeave = () => setConfirmingLeaveId(null)

  const leave = async (group: GroupSummary) => {
    try {
      await client.leave(group.id)
      setConfirmingLeaveId(null)
      void refresh()
    } catch (error) {
      setConfirmingLeaveId(null)
      setError(errorMessage(error, 'Impossible de quitter le Groupe'))
    }
  }

  return (
    <section className="space-y-4">
      {error ? (
        <p className="text-negative" role="alert">
          {error}
        </p>
      ) : null}
      <CreateGroupFields form={createForm} error={createError} onSubmit={onCreate} />
      <GroupsList
        groups={groups}
        renamingId={renamingId}
        confirmingId={confirmingLeaveId}
        renameForm={renameForm}
        renameError={renameError}
        onStartRename={startRename}
        onCancelRename={cancelRename}
        onRename={onRename}
        onStartLeave={startLeave}
        onCancelLeave={cancelLeave}
        onLeave={leave}
      />
    </section>
  )
}
