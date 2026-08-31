import { describe, expect, it } from 'vite-plus/test'
import { amountReconstitute, dayReconstitute } from '~/shared/domain'
import { PAYBACK_ABOVE_CAP, type Payback } from '~/paybacks/domain/payback.entity'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'
import { slateFixture, viewFixture } from '~/shared/test/slateFixture'
import { paybackMutation } from './paybackMutation.uc'

// u1 is owed 66, u2 owes 33: a Payback from u2 to u1 is capped at 33.
const createSlate = () =>
  slateFixture({
    balances: [
      { userId: 'u1', name: 'Léa', amount: 66 },
      { userId: 'u2', name: 'Bob', amount: -33 }
    ]
  })

// The snapshot carries the edited Payback (20) and Balances that include it:
// without it u2 owes 33, still capped at 33. Both come from the same read.
const editSlate = () =>
  slateFixture({
    balances: [
      { userId: 'u1', name: 'Léa', amount: 66 },
      { userId: 'u2', name: 'Bob', amount: -13 }
    ],
    paybacks: [{ id: 'p1', debtorId: 'u2', creditorId: 'u1', day: '2026-08-31', amount: 20 }]
  })

const repo = (
  opts: {
    saved?: Payback[]
    updated?: Payback[]
    deleted?: string[]
  } = {}
): PaybackRepository => ({
  save: async payback => {
    opts.saved?.push(payback)
  },
  findById: async () => null,
  findByGroupId: async () => [],
  update: async payback => {
    opts.updated?.push(payback)
  },
  delete: async id => {
    opts.deleted?.push(id)
  }
})

describe('paybackMutation.create', () => {
  it('saves a Payback under the cap and returns the fresh slate', async () => {
    const saved: Payback[] = []
    const calls: string[] = []
    const mutation = paybackMutation(repo({ saved }), viewFixture(calls, createSlate()))

    const result = await mutation.create.execute('u2', 'g1', {
      debtorId: 'u2',
      creditorId: 'u1',
      day: '2026-08-31',
      amount: 20
    })

    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      groupId: 'g1',
      debtorId: 'u2',
      creditorId: 'u1',
      day: { value: '2026-08-31' },
      amount: { value: 20 }
    })
    expect(calls).toEqual(['u2:g1', 'u2:g1'])
    expect(result).toEqual(createSlate())
  })

  it('refuses a Payback above the cap without saving', async () => {
    const saved: Payback[] = []
    const mutation = paybackMutation(repo({ saved }), viewFixture([], createSlate()))

    const create = mutation.create.execute('u2', 'g1', {
      debtorId: 'u2',
      creditorId: 'u1',
      day: '2026-08-31',
      amount: 34
    })

    await expect(create).rejects.toMatchObject({ code: 'INVALID_DATA', message: PAYBACK_ABOVE_CAP })
    expect(saved).toEqual([])
  })

  it('refuses a debtor who is not a Member without saving', async () => {
    const saved: Payback[] = []
    const mutation = paybackMutation(repo({ saved }), viewFixture([], createSlate()))

    const create = mutation.create.execute('u2', 'g1', {
      debtorId: 'u9',
      creditorId: 'u1',
      day: '2026-08-31',
      amount: 10
    })

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: 'Membre introuvable'
    })
    expect(saved).toEqual([])
  })
})

describe('paybackMutation.update', () => {
  it('updates the Payback keeping the id and returns the fresh slate', async () => {
    const updated: Payback[] = []
    const calls: string[] = []
    const mutation = paybackMutation(repo({ updated }), viewFixture(calls, editSlate()))

    const result = await mutation.update.execute('u1', 'g1', 'p1', {
      debtorId: 'u2',
      creditorId: 'u1',
      day: '2026-08-31',
      amount: 30
    })

    expect(updated).toHaveLength(1)
    expect(updated[0]).toEqual({
      id: 'p1',
      groupId: 'g1',
      debtorId: 'u2',
      creditorId: 'u1',
      day: dayReconstitute('2026-08-31'),
      amount: amountReconstitute(30)
    })
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(editSlate())
  })

  it('re-validates against the Balances without the edited Payback', async () => {
    const updated: Payback[] = []
    const mutation = paybackMutation(repo({ updated }), viewFixture([], editSlate()))

    await mutation.update.execute('u1', 'g1', 'p1', {
      debtorId: 'u2',
      creditorId: 'u1',
      day: '2026-08-31',
      amount: 33
    })

    expect(updated[0]?.amount.value).toBe(33)
  })

  it('refuses an update above the cap without saving', async () => {
    const updated: Payback[] = []
    const mutation = paybackMutation(repo({ updated }), viewFixture([], editSlate()))

    const update = mutation.update.execute('u1', 'g1', 'p1', {
      debtorId: 'u2',
      creditorId: 'u1',
      day: '2026-08-31',
      amount: 34
    })

    await expect(update).rejects.toMatchObject({ code: 'INVALID_DATA', message: PAYBACK_ABOVE_CAP })
    expect(updated).toEqual([])
  })

  it('refuses an unknown Payback', async () => {
    const updated: Payback[] = []
    const mutation = paybackMutation(repo({ updated }), viewFixture([], editSlate()))

    const update = mutation.update.execute('u1', 'g1', 'inconnu', {
      debtorId: 'u2',
      creditorId: 'u1',
      day: '2026-08-31',
      amount: 20
    })

    await expect(update).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Règlement introuvable'
    })
    expect(updated).toEqual([])
  })

  it('refuses a Member who is not in the Group', async () => {
    const updated: Payback[] = []
    const mutation = paybackMutation(repo({ updated }), viewFixture([], editSlate()))

    const update = mutation.update.execute('u1', 'g1', 'p1', {
      debtorId: 'u9',
      creditorId: 'u1',
      day: '2026-08-31',
      amount: 20
    })

    await expect(update).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: 'Membre introuvable'
    })
    expect(updated).toEqual([])
  })
})

describe('paybackMutation.delete', () => {
  it('deletes the Payback and returns the fresh slate', async () => {
    const deleted: string[] = []
    const calls: string[] = []
    const mutation = paybackMutation(repo({ deleted }), viewFixture(calls, editSlate()))

    const result = await mutation.delete.execute('u1', 'g1', 'p1')

    expect(deleted).toEqual(['p1'])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(editSlate())
  })

  it('refuses an unknown Payback', async () => {
    const deleted: string[] = []
    const mutation = paybackMutation(repo({ deleted }), viewFixture([], editSlate()))

    const remove = mutation.delete.execute('u1', 'g1', 'inconnu')

    await expect(remove).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Règlement introuvable'
    })
    expect(deleted).toEqual([])
  })
})
