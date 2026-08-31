import { describe, expect, it } from 'vite-plus/test'
import { notFound } from '~/shared/domain'
import { slateFixture, viewFixture } from '~/shared/test/slateFixture'
import { slateMutation } from './slateMutation.uc'

type FakeEntity = { id: string; groupId: string; value: string }
type FakeInput = { ownerId: string; value: string }

const setup = (found: FakeEntity | null = null) => {
  const calls: string[] = []
  const created: FakeEntity[] = []
  const updated: FakeEntity[] = []
  const deleted: string[] = []
  const mutation = slateMutation<FakeInput, FakeEntity>(viewFixture(calls, slateFixture()), {
    noun: 'Truc',
    referencedMemberIds: input => [input.ownerId],
    load: async () => found,
    buildCreate: (_slate, groupId, input) => ({ id: 'n1', groupId, value: input.value }),
    buildUpdate: (_slate, groupId, input, existing) => ({
      id: existing.id,
      groupId,
      value: input.value
    }),
    persist: {
      create: async entity => {
        created.push(entity)
      },
      update: async entity => {
        updated.push(entity)
      },
      delete: async id => {
        deleted.push(id)
      }
    }
  })
  return { calls, created, updated, deleted, mutation }
}

describe('slateMutation.create', () => {
  it('authorizes, builds, persists and refreshes the Slate', async () => {
    const { calls, created, mutation } = setup()

    const result = await mutation.create.execute('u1', 'g1', { ownerId: 'u1', value: 'x' })

    expect(created).toEqual([{ id: 'n1', groupId: 'g1', value: 'x' }])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slateFixture())
  })

  it('refuses a referenced Member who is not in the Group without persisting', async () => {
    const { created, mutation } = setup()

    const create = mutation.create.execute('u1', 'g1', { ownerId: 'u9', value: 'x' })

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: 'Membre introuvable'
    })
    expect(created).toEqual([])
  })

  it('propagates the authorization failure from the first Slate read', async () => {
    const created: FakeEntity[] = []
    const mutation = slateMutation<FakeInput, FakeEntity>(
      {
        execute: async () => {
          throw notFound('Groupe introuvable')
        }
      },
      {
        noun: 'Truc',
        referencedMemberIds: input => [input.ownerId],
        load: async () => null,
        buildCreate: (_slate, groupId, input) => ({ id: 'n1', groupId, value: input.value }),
        buildUpdate: (_slate, groupId, input, existing) => ({
          id: existing.id,
          groupId,
          value: input.value
        }),
        persist: {
          create: async entity => {
            created.push(entity)
          },
          update: async () => undefined,
          delete: async () => undefined
        }
      }
    )

    const create = mutation.create.execute('u9', 'g1', { ownerId: 'u1', value: 'x' })

    await expect(create).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Groupe introuvable' })
    expect(created).toEqual([])
  })
})

describe('slateMutation.update', () => {
  it('loads, builds on the existing entity and refreshes the Slate', async () => {
    const { calls, updated, mutation } = setup({ id: 'e1', groupId: 'g1', value: 'old' })

    const result = await mutation.update.execute('u1', 'g1', 'e1', { ownerId: 'u1', value: 'new' })

    expect(updated).toEqual([{ id: 'e1', groupId: 'g1', value: 'new' }])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slateFixture())
  })

  it('refuses an unknown entity without persisting', async () => {
    const { updated, mutation } = setup(null)

    const update = mutation.update.execute('u1', 'g1', 'inconnu', { ownerId: 'u1', value: 'new' })

    await expect(update).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Truc introuvable' })
    expect(updated).toEqual([])
  })

  it('refuses an entity of another Group without persisting', async () => {
    const { updated, mutation } = setup({ id: 'e1', groupId: 'g2', value: 'old' })

    const update = mutation.update.execute('u1', 'g1', 'e1', { ownerId: 'u1', value: 'new' })

    await expect(update).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Truc introuvable' })
    expect(updated).toEqual([])
  })

  it('refuses a referenced Member who is not in the Group without persisting', async () => {
    const { updated, mutation } = setup({ id: 'e1', groupId: 'g1', value: 'old' })

    const update = mutation.update.execute('u1', 'g1', 'e1', { ownerId: 'u9', value: 'new' })

    await expect(update).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: 'Membre introuvable'
    })
    expect(updated).toEqual([])
  })
})

describe('slateMutation.delete', () => {
  it('loads, deletes by id and refreshes the Slate', async () => {
    const { calls, deleted, mutation } = setup({ id: 'e1', groupId: 'g1', value: 'old' })

    const result = await mutation.delete.execute('u1', 'g1', 'e1')

    expect(deleted).toEqual(['e1'])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slateFixture())
  })

  it('refuses an unknown entity without deleting', async () => {
    const { deleted, mutation } = setup(null)

    const remove = mutation.delete.execute('u1', 'g1', 'inconnu')

    await expect(remove).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Truc introuvable' })
    expect(deleted).toEqual([])
  })

  it('refuses an entity of another Group without deleting', async () => {
    const { deleted, mutation } = setup({ id: 'e1', groupId: 'g2', value: 'old' })

    const remove = mutation.delete.execute('u1', 'g1', 'e1')

    await expect(remove).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Truc introuvable' })
    expect(deleted).toEqual([])
  })
})
