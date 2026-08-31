import type { SlateView } from '~/groups/application/getSlate.uc'
import type { GroupDto } from '~/groups/application/group.dto'
import { invalidData, notFound } from '~/shared/domain'

/**
 * What a Slate entry mutation differs on, per vocabulary. The orchestrator
 * (`slateMutation`) owns the whole skeleton — read-and-authorize, load and
 * check the Group, validate referenced Members, build, persist, refresh — and
 * these fields supply only the variation. ADR 0002 keeps Expense, Service and
 * Payback as separate entities: only the orchestration is shared.
 */
export type SlateMutationSpec<TInput, TEntity extends { id: string; groupId: string }> = {
  /** Base noun of the not-found message, e.g. 'Dépense' -> 'Dépense introuvable'. */
  noun: string
  /** Member ids the mutation references; all must sit in the Slate's Members. */
  referencedMemberIds: (input: TInput, slate: GroupDto, existing?: TEntity) => string[]
  /**
   * Loads the entity to mutate (update/delete). Receives the slate snapshot so
   * a vocabulary can read the entity from the same snapshot as its validation
   * baseline (the Payback cap must not mix two reads).
   */
  load: (id: string, slate: GroupDto) => Promise<TEntity | null>
  buildCreate: (slate: GroupDto, groupId: string, input: TInput) => TEntity
  buildUpdate: (slate: GroupDto, groupId: string, input: TInput, existing: TEntity) => TEntity
  persist: {
    create: (entity: TEntity) => Promise<void>
    update: (entity: TEntity) => Promise<void>
    delete: (id: string) => Promise<void>
  }
}

export type SlateMutation<TInput> = {
  create: { execute: (userId: string, groupId: string, input: TInput) => Promise<GroupDto> }
  update: {
    execute: (userId: string, groupId: string, id: string, input: TInput) => Promise<GroupDto>
  }
  delete: { execute: (userId: string, groupId: string, id: string) => Promise<GroupDto> }
}

export const slateMutation = <TInput, TEntity extends { id: string; groupId: string }>(
  view: SlateView,
  spec: SlateMutationSpec<TInput, TEntity>
): SlateMutation<TInput> => {
  // The read-and-authorize is the first slate read: getSlate throws when the
  // caller is not a Member. The returned value is the post-write refresh.
  const requireExisting = async (id: string, groupId: string, slate: GroupDto) => {
    const existing = await spec.load(id, slate)
    if (!existing || existing.groupId !== groupId) {
      throw notFound(`${spec.noun} introuvable`)
    }
    return existing
  }
  const requireMembers = (input: TInput, slate: GroupDto, existing?: TEntity) => {
    const memberIds = slate.members.map(member => member.userId)
    if (spec.referencedMemberIds(input, slate, existing).some(id => !memberIds.includes(id))) {
      throw invalidData('Membre introuvable')
    }
  }
  return {
    create: {
      execute: async (userId, groupId, input) => {
        const slate = await view.execute(userId, groupId)
        requireMembers(input, slate)
        await spec.persist.create(spec.buildCreate(slate, groupId, input))
        return view.execute(userId, groupId)
      }
    },
    update: {
      execute: async (userId, groupId, id, input) => {
        const slate = await view.execute(userId, groupId)
        const existing = await requireExisting(id, groupId, slate)
        requireMembers(input, slate, existing)
        await spec.persist.update(spec.buildUpdate(slate, groupId, input, existing))
        return view.execute(userId, groupId)
      }
    },
    delete: {
      execute: async (userId, groupId, id) => {
        // The read is the authorization: getSlate throws when not a Member.
        const slate = await view.execute(userId, groupId)
        const existing = await requireExisting(id, groupId, slate)
        await spec.persist.delete(existing.id)
        return view.execute(userId, groupId)
      }
    }
  }
}
