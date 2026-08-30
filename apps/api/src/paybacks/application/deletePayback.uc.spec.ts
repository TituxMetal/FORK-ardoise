import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from '~/groups/application/group.dto'
import { amountReconstitute } from '~/shared/domain'
import { paybackReconstitute, type Payback } from '~/paybacks/domain/payback.entity'
import type { PaybackRepository } from '~/paybacks/domain/payback.repository'
import { deletePayback } from './deletePayback.uc'

const virement = (groupId = 'g1'): Payback =>
  paybackReconstitute('p1', groupId, 'u2', 'u1', amountReconstitute(10))

const slate = (): GroupDto => ({
  id: 'g1',
  name: 'Potes de Bob',
  selfMemberId: 'u1',
  members: [{ userId: 'u1', name: 'Léa' }],
  invite: { secret: 'secret' },
  expenses: [],
  services: [],
  paybacks: [],
  balances: [{ userId: 'u1', name: 'Léa', amount: 0 }]
})

const repository = (deleted: string[], found: Payback | null): PaybackRepository => ({
  save: async () => undefined,
  findById: async () => found,
  findByGroupId: async () => [],
  delete: async id => {
    deleted.push(id)
  }
})

describe('deletePayback', () => {
  it('deletes the Payback and returns the fresh slate', async () => {
    const deleted: string[] = []
    const calls: string[] = []
    const paybacks = deletePayback(repository(deleted, virement()), {
      execute: async (userId, groupId) => {
        calls.push(`${userId}:${groupId}`)
        return slate()
      }
    })

    const result = await paybacks.execute('u1', 'g1', 'p1')

    expect(deleted).toEqual(['p1'])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slate())
  })

  it('refuses an unknown Payback without deleting', async () => {
    const deleted: string[] = []
    const paybacks = deletePayback(repository(deleted, null), { execute: async () => slate() })

    const remove = paybacks.execute('u1', 'g1', 'inconnu')

    await expect(remove).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Règlement introuvable'
    })
    expect(deleted).toEqual([])
  })

  it('refuses a Payback of another Group without deleting', async () => {
    const deleted: string[] = []
    const paybacks = deletePayback(repository(deleted, virement('g2')), {
      execute: async () => slate()
    })

    const remove = paybacks.execute('u1', 'g1', 'p1')

    await expect(remove).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Règlement introuvable'
    })
    expect(deleted).toEqual([])
  })
})
