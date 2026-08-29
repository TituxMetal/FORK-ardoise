import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from '~/groups/application/group.dto'
import { PAYBACK_ABOVE_CAP } from '~/paybacks/domain/payback.entity'
import type { Payback } from '~/paybacks/domain/payback.entity'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'
import { createPayback } from './createPayback.uc'

const members = [
  { userId: 'u1', name: 'Léa' },
  { userId: 'u2', name: 'Bob' }
]

const slate = (): GroupDto => ({
  id: 'g1',
  name: 'Potes de Bob',
  members,
  invite: { secret: 'secret' },
  expenses: [],
  services: [],
  paybacks: [],
  balances: [
    { userId: 'u1', name: 'Léa', amount: 66 },
    { userId: 'u2', name: 'Bob', amount: -33 }
  ]
})

const repository = (saved: Payback[] = []): PaybackRepository => ({
  save: async payback => {
    saved.push(payback)
  },
  findById: async () => null,
  findByGroupId: async () => [],
  delete: async () => undefined
})

const view = (calls: string[]) => ({
  execute: async (userId: string, groupId: string) => {
    calls.push(`${userId}:${groupId}`)
    return slate()
  }
})

describe('createPayback', () => {
  it('saves a Payback under the cap and returns the fresh slate', async () => {
    const saved: Payback[] = []
    const calls: string[] = []
    const paybacks = createPayback(repository(saved), view(calls))

    const result = await paybacks.execute('u2', 'g1', {
      debtorId: 'u2',
      creditorId: 'u1',
      amount: 20
    })

    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      groupId: 'g1',
      debtorId: 'u2',
      creditorId: 'u1',
      amount: { value: 20 }
    })
    expect(calls).toEqual(['u2:g1', 'u2:g1'])
    expect(result).toEqual(slate())
  })

  it('refuses a Payback above the cap without saving', async () => {
    const saved: Payback[] = []
    const paybacks = createPayback(repository(saved), view([]))

    const create = paybacks.execute('u2', 'g1', {
      debtorId: 'u2',
      creditorId: 'u1',
      amount: 34
    })

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: PAYBACK_ABOVE_CAP
    })
    expect(saved).toEqual([])
  })

  it('refuses a debtor who is not a Member without saving', async () => {
    const saved: Payback[] = []
    const paybacks = createPayback(repository(saved), view([]))

    const create = paybacks.execute('u2', 'g1', {
      debtorId: 'u9',
      creditorId: 'u1',
      amount: 10
    })

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: 'Membre introuvable'
    })
    expect(saved).toEqual([])
  })
})
