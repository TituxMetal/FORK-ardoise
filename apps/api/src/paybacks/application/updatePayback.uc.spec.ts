import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from '~/groups/application/group.dto'
import { amountReconstitute } from '~/shared/domain'
import { dayReconstitute } from '~/expenses/domain/day.vo'
import {
  PAYBACK_ABOVE_CAP,
  paybackReconstitute,
  type Payback
} from '~/paybacks/domain/payback.entity'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'
import { updatePayback } from './updatePayback.uc'

const virement = (groupId = 'g1'): Payback =>
  paybackReconstitute(
    'p1',
    groupId,
    'u2',
    'u1',
    dayReconstitute('2026-08-31'),
    amountReconstitute(20)
  )

const slate = (): GroupDto => ({
  id: 'g1',
  name: 'Potes de Bob',
  selfMemberId: 'u1',
  members: [
    { userId: 'u1', name: 'Léa' },
    { userId: 'u2', name: 'Bob' }
  ],
  invite: { secret: 'secret' },
  expenses: [],
  services: [],
  // The snapshot carries the Payback being edited (DTO shape), so the cap
  // baseline derives it without a second read.
  paybacks: [{ id: 'p1', debtorId: 'u2', creditorId: 'u1', day: '2026-08-31', amount: 20 }],
  balances: [
    { userId: 'u1', name: 'Léa', amount: 46 },
    { userId: 'u2', name: 'Bob', amount: -13 }
  ]
})

const repository = (updated: Payback[], found: Payback | null): PaybackRepository => ({
  save: async () => undefined,
  findById: async () => found,
  findByGroupId: async () => [],
  update: async payback => {
    updated.push(payback)
  },
  delete: async () => undefined
})

describe('updatePayback', () => {
  it('updates the Payback keeping the id and returns the fresh slate', async () => {
    const updated: Payback[] = []
    const calls: string[] = []
    const paybacks = updatePayback(repository(updated, virement()), {
      execute: async (userId, groupId) => {
        calls.push(`${userId}:${groupId}`)
        return slate()
      }
    })

    const result = await paybacks.execute('u1', 'g1', 'p1', {
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
    expect(result).toEqual(slate())
  })

  it('re-validates against the Balances without the edited Payback', async () => {
    // Balances include the existing 20; without it Bob owes 33, so 33 fits.
    const updated: Payback[] = []
    const paybacks = updatePayback(repository(updated, virement()), {
      execute: async () => slate()
    })

    await paybacks.execute('u1', 'g1', 'p1', {
      debtorId: 'u2',
      creditorId: 'u1',
      day: '2026-08-31',
      amount: 33
    })

    expect(updated[0]?.amount.value).toBe(33)
  })

  it('refuses an update above the cap without saving', async () => {
    const updated: Payback[] = []
    const paybacks = updatePayback(repository(updated, virement()), {
      execute: async () => slate()
    })

    const edit = paybacks.execute('u1', 'g1', 'p1', {
      debtorId: 'u2',
      creditorId: 'u1',
      day: '2026-08-31',
      amount: 34
    })

    await expect(edit).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: PAYBACK_ABOVE_CAP
    })
    expect(updated).toEqual([])
  })

  it('refuses an unknown Payback without updating', async () => {
    const updated: Payback[] = []
    const paybacks = updatePayback(repository(updated, null), { execute: async () => slate() })

    const edit = paybacks.execute('u1', 'g1', 'inconnu', {
      debtorId: 'u2',
      creditorId: 'u1',
      day: '2026-08-31',
      amount: 10
    })

    await expect(edit).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Règlement introuvable'
    })
    expect(updated).toEqual([])
  })

  it('refuses a Member who is not in the Group without updating', async () => {
    const updated: Payback[] = []
    const paybacks = updatePayback(repository(updated, virement()), {
      execute: async () => slate()
    })

    const edit = paybacks.execute('u1', 'g1', 'p1', {
      debtorId: 'u9',
      creditorId: 'u1',
      day: '2026-08-31',
      amount: 10
    })

    await expect(edit).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: 'Membre introuvable'
    })
    expect(updated).toEqual([])
  })
})
