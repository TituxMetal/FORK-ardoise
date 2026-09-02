import { describe, expect, it } from 'vite-plus/test'
import { amountReconstitute, dayReconstitute, PARTICIPANTS_REQUIRED } from '~/shared/domain'
import { serviceReconstitute, type Service, type ServiceRepository } from '../domain'
import { labelReconstitute, LABEL_REQUIRED } from '~/expenses/domain'
import { slateFixture, viewFixture } from '~/shared/test'
import { serviceMutation } from './serviceMutation.uc'

const babysitting = (groupId = 'g1'): Service =>
  serviceReconstitute(
    's1',
    groupId,
    labelReconstitute('Babysitting'),
    dayReconstitute('2026-08-15'),
    amountReconstitute(50),
    'u1',
    ['u1', 'u2'],
    [
      { userId: 'u1', amount: amountReconstitute(25) },
      { userId: 'u2', amount: amountReconstitute(25) }
    ]
  )

const repo = (
  opts: {
    saved?: Service[]
    updated?: Service[]
    deleted?: string[]
    found?: Service | null
  } = {}
): ServiceRepository => ({
  save: async service => {
    opts.saved?.push(service)
  },
  findById: async () => opts.found ?? null,
  findByGroupId: async () => [],
  update: async service => {
    opts.updated?.push(service)
  },
  delete: async id => {
    opts.deleted?.push(id)
  }
})

describe('serviceMutation.create', () => {
  it('saves the Service and returns the fresh slate', async () => {
    const saved: Service[] = []
    const calls: string[] = []
    const mutation = serviceMutation(repo({ saved }), viewFixture(calls, slateFixture()))

    const result = await mutation.create.execute('u1', 'g1', {
      label: '  Babysitting  ',
      day: '2026-08-15',
      amount: 50,
      providerId: 'u1',
      participantIds: ['u1', 'u2']
    })

    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      groupId: 'g1',
      label: { value: 'Babysitting' },
      day: { value: '2026-08-15' },
      amount: { value: 50 },
      providerId: 'u1',
      participantIds: ['u1', 'u2']
    })
    expect(saved[0]?.parts.map(part => part.amount.value)).toEqual([25, 25])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slateFixture())
  })

  it('defaults omitted Participants to every Member', async () => {
    const saved: Service[] = []
    const mutation = serviceMutation(repo({ saved }), viewFixture([], slateFixture()))

    await mutation.create.execute('u1', 'g1', {
      label: 'Babysitting',
      day: '2026-08-15',
      amount: 50,
      providerId: 'u1'
    })

    expect(saved[0]?.participantIds).toEqual(['u1', 'u2'])
  })

  it('refuses a Provider who is not a Member without saving', async () => {
    const saved: Service[] = []
    const mutation = serviceMutation(repo({ saved }), viewFixture([], slateFixture()))

    const create = mutation.create.execute('u1', 'g1', {
      label: 'Babysitting',
      day: '2026-08-15',
      amount: 50,
      providerId: 'u9',
      participantIds: ['u1', 'u2']
    })

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: 'Membre introuvable'
    })
    expect(saved).toEqual([])
  })

  it('refuses an empty Participant list', async () => {
    const saved: Service[] = []
    const mutation = serviceMutation(repo({ saved }), viewFixture([], slateFixture()))

    const create = mutation.create.execute('u1', 'g1', {
      label: 'Babysitting',
      day: '2026-08-15',
      amount: 50,
      providerId: 'u1',
      participantIds: []
    })

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: PARTICIPANTS_REQUIRED
    })
    expect(saved).toEqual([])
  })

  it('refuses a blank label', async () => {
    const saved: Service[] = []
    const mutation = serviceMutation(repo({ saved }), viewFixture([], slateFixture()))

    const create = mutation.create.execute('u1', 'g1', {
      label: '  ',
      day: '2026-08-15',
      amount: 50,
      providerId: 'u1'
    })

    await expect(create).rejects.toMatchObject({ code: 'INVALID_DATA', message: LABEL_REQUIRED })
    expect(saved).toEqual([])
  })
})

describe('serviceMutation.update', () => {
  it('updates the Service keeping the id and returns the fresh slate', async () => {
    const updated: Service[] = []
    const calls: string[] = []
    const mutation = serviceMutation(
      repo({ updated, found: babysitting() }),
      viewFixture(calls, slateFixture())
    )

    const result = await mutation.update.execute('u1', 'g1', 's1', {
      label: 'Babysitting long',
      day: '2026-08-16',
      amount: 60,
      providerId: 'u2',
      participantIds: ['u1', 'u2']
    })

    expect(updated).toHaveLength(1)
    expect(updated[0]).toMatchObject({
      id: 's1',
      groupId: 'g1',
      label: { value: 'Babysitting long' },
      day: { value: '2026-08-16' },
      amount: { value: 60 },
      providerId: 'u2',
      participantIds: ['u1', 'u2']
    })
    expect(updated[0]?.parts.map(part => part.amount.value)).toEqual([30, 30])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slateFixture())
  })

  it('keeps the existing Participants when the list is omitted', async () => {
    const updated: Service[] = []
    const mutation = serviceMutation(
      repo({ updated, found: babysitting() }),
      viewFixture([], slateFixture())
    )

    await mutation.update.execute('u1', 'g1', 's1', {
      label: 'Babysitting',
      day: '2026-08-15',
      amount: 50,
      providerId: 'u1'
    })

    expect(updated[0]?.participantIds).toEqual(['u1', 'u2'])
  })

  it('refuses an unknown Service', async () => {
    const updated: Service[] = []
    const mutation = serviceMutation(
      repo({ updated, found: null }),
      viewFixture([], slateFixture())
    )

    const update = mutation.update.execute('u1', 'g1', 'inconnu', {
      label: 'Babysitting',
      day: '2026-08-15',
      amount: 50,
      providerId: 'u1'
    })

    await expect(update).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Service introuvable'
    })
    expect(updated).toEqual([])
  })

  it('refuses a Service of another Group', async () => {
    const updated: Service[] = []
    const mutation = serviceMutation(
      repo({ updated, found: babysitting('g2') }),
      viewFixture([], slateFixture())
    )

    const update = mutation.update.execute('u1', 'g1', 's1', {
      label: 'Babysitting',
      day: '2026-08-15',
      amount: 50,
      providerId: 'u1'
    })

    await expect(update).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Service introuvable'
    })
    expect(updated).toEqual([])
  })
})

describe('serviceMutation.delete', () => {
  it('deletes the Service and returns the fresh slate', async () => {
    const deleted: string[] = []
    const calls: string[] = []
    const mutation = serviceMutation(
      repo({ deleted, found: babysitting() }),
      viewFixture(calls, slateFixture())
    )

    const result = await mutation.delete.execute('u1', 'g1', 's1')

    expect(deleted).toEqual(['s1'])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slateFixture())
  })

  it('refuses an unknown Service', async () => {
    const deleted: string[] = []
    const mutation = serviceMutation(
      repo({ deleted, found: null }),
      viewFixture([], slateFixture())
    )

    const remove = mutation.delete.execute('u1', 'g1', 'inconnu')

    await expect(remove).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Service introuvable'
    })
    expect(deleted).toEqual([])
  })

  it('refuses a Service of another Group', async () => {
    const deleted: string[] = []
    const mutation = serviceMutation(
      repo({ deleted, found: babysitting('g2') }),
      viewFixture([], slateFixture())
    )

    const remove = mutation.delete.execute('u1', 'g1', 's1')

    await expect(remove).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Service introuvable'
    })
    expect(deleted).toEqual([])
  })
})
