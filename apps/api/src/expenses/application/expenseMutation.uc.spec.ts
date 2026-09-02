import { describe, expect, it } from 'vite-plus/test'
import { amountReconstitute, dayReconstitute, PARTICIPANTS_REQUIRED } from '~/shared/domain'
import {
  expenseReconstitute,
  type Expense,
  labelReconstitute,
  LABEL_REQUIRED,
  type ExpenseRepository
} from '../domain'
import { slateFixture, viewFixture } from '~/shared/test'
import { expenseMutation } from './expenseMutation.uc'

const pizza = (groupId = 'g1'): Expense =>
  expenseReconstitute(
    'e1',
    groupId,
    labelReconstitute('Pizza'),
    dayReconstitute('2026-08-15'),
    amountReconstitute(100),
    'u1',
    ['u1', 'u2'],
    [
      { userId: 'u1', amount: amountReconstitute(50) },
      { userId: 'u2', amount: amountReconstitute(50) }
    ]
  )

const repo = (
  opts: {
    saved?: Expense[]
    updated?: Expense[]
    deleted?: string[]
    found?: Expense | null
  } = {}
): ExpenseRepository => ({
  save: async expense => {
    opts.saved?.push(expense)
  },
  findById: async () => opts.found ?? null,
  findByGroupId: async () => [],
  update: async expense => {
    opts.updated?.push(expense)
  },
  delete: async id => {
    opts.deleted?.push(id)
  }
})

describe('expenseMutation.create', () => {
  it('saves the Expense and returns the fresh slate', async () => {
    const saved: Expense[] = []
    const calls: string[] = []
    const mutation = expenseMutation(repo({ saved }), viewFixture(calls, slateFixture()))

    const result = await mutation.create.execute('u1', 'g1', {
      label: '  Pizza  ',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1',
      participantIds: ['u1', 'u2']
    })

    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      groupId: 'g1',
      label: { value: 'Pizza' },
      day: { value: '2026-08-15' },
      amount: { value: 100 },
      payerId: 'u1',
      participantIds: ['u1', 'u2']
    })
    expect(saved[0]?.parts.map(part => part.amount.value)).toEqual([50, 50])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slateFixture())
  })

  it('defaults omitted Participants to every Member', async () => {
    const saved: Expense[] = []
    const mutation = expenseMutation(repo({ saved }), viewFixture([], slateFixture()))

    await mutation.create.execute('u1', 'g1', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1'
    })

    expect(saved[0]?.participantIds).toEqual(['u1', 'u2'])
  })

  it('refuses a Payer who is not a Member without saving', async () => {
    const saved: Expense[] = []
    const mutation = expenseMutation(repo({ saved }), viewFixture([], slateFixture()))

    const create = mutation.create.execute('u1', 'g1', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u9',
      participantIds: ['u1', 'u2']
    })

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: 'Membre introuvable'
    })
    expect(saved).toEqual([])
  })

  it('refuses an empty Participant list', async () => {
    const saved: Expense[] = []
    const mutation = expenseMutation(repo({ saved }), viewFixture([], slateFixture()))

    const create = mutation.create.execute('u1', 'g1', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1',
      participantIds: []
    })

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: PARTICIPANTS_REQUIRED
    })
    expect(saved).toEqual([])
  })

  it('refuses a blank label', async () => {
    const saved: Expense[] = []
    const mutation = expenseMutation(repo({ saved }), viewFixture([], slateFixture()))

    const create = mutation.create.execute('u1', 'g1', {
      label: '  ',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1'
    })

    await expect(create).rejects.toMatchObject({ code: 'INVALID_DATA', message: LABEL_REQUIRED })
    expect(saved).toEqual([])
  })
})

describe('expenseMutation.update', () => {
  it('updates the Expense keeping the id and returns the fresh slate', async () => {
    const updated: Expense[] = []
    const calls: string[] = []
    const mutation = expenseMutation(
      repo({ updated, found: pizza() }),
      viewFixture(calls, slateFixture())
    )

    const result = await mutation.update.execute('u1', 'g1', 'e1', {
      label: 'Pizza plus',
      day: '2026-08-16',
      amount: 200,
      payerId: 'u2',
      participantIds: ['u1', 'u2']
    })

    expect(updated).toHaveLength(1)
    expect(updated[0]).toMatchObject({
      id: 'e1',
      groupId: 'g1',
      label: { value: 'Pizza plus' },
      day: { value: '2026-08-16' },
      amount: { value: 200 },
      payerId: 'u2',
      participantIds: ['u1', 'u2']
    })
    expect(updated[0]?.parts.map(part => part.amount.value)).toEqual([100, 100])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slateFixture())
  })

  it('keeps the existing Participants when the list is omitted', async () => {
    const updated: Expense[] = []
    const mutation = expenseMutation(
      repo({ updated, found: pizza() }),
      viewFixture([], slateFixture())
    )

    await mutation.update.execute('u1', 'g1', 'e1', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1'
    })

    expect(updated[0]?.participantIds).toEqual(['u1', 'u2'])
  })

  it('refuses an unknown Expense', async () => {
    const updated: Expense[] = []
    const mutation = expenseMutation(
      repo({ updated, found: null }),
      viewFixture([], slateFixture())
    )

    const update = mutation.update.execute('u1', 'g1', 'inconnu', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1'
    })

    await expect(update).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Dépense introuvable'
    })
    expect(updated).toEqual([])
  })

  it('refuses an Expense of another Group', async () => {
    const updated: Expense[] = []
    const mutation = expenseMutation(
      repo({ updated, found: pizza('g2') }),
      viewFixture([], slateFixture())
    )

    const update = mutation.update.execute('u1', 'g1', 'e1', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u1'
    })

    await expect(update).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Dépense introuvable'
    })
    expect(updated).toEqual([])
  })

  it('refuses a Payer who is not a Member', async () => {
    const updated: Expense[] = []
    const mutation = expenseMutation(
      repo({ updated, found: pizza() }),
      viewFixture([], slateFixture())
    )

    const update = mutation.update.execute('u1', 'g1', 'e1', {
      label: 'Pizza',
      day: '2026-08-15',
      amount: 100,
      payerId: 'u9',
      participantIds: ['u1', 'u2']
    })

    await expect(update).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: 'Membre introuvable'
    })
    expect(updated).toEqual([])
  })
})

describe('expenseMutation.delete', () => {
  it('deletes the Expense and returns the fresh slate', async () => {
    const deleted: string[] = []
    const calls: string[] = []
    const mutation = expenseMutation(
      repo({ deleted, found: pizza() }),
      viewFixture(calls, slateFixture())
    )

    const result = await mutation.delete.execute('u1', 'g1', 'e1')

    expect(deleted).toEqual(['e1'])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slateFixture())
  })

  it('refuses an unknown Expense', async () => {
    const deleted: string[] = []
    const mutation = expenseMutation(
      repo({ deleted, found: null }),
      viewFixture([], slateFixture())
    )

    const remove = mutation.delete.execute('u1', 'g1', 'inconnu')

    await expect(remove).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Dépense introuvable'
    })
    expect(deleted).toEqual([])
  })

  it('refuses an Expense of another Group', async () => {
    const deleted: string[] = []
    const mutation = expenseMutation(
      repo({ deleted, found: pizza('g2') }),
      viewFixture([], slateFixture())
    )

    const remove = mutation.delete.execute('u1', 'g1', 'e1')

    await expect(remove).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Dépense introuvable'
    })
    expect(deleted).toEqual([])
  })
})
