import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from '~/groups/application/group.dto'
import { amountReconstitute } from '~/shared/domain'
import { dayReconstitute } from '~/expenses/domain/day.vo'
import { labelReconstitute } from '~/expenses/domain/label.vo'
import { serviceReconstitute, type Service } from '~/services/domain/service.entity'
import type { ServiceRepository } from '~/services/domain/service.repository'
import { deleteService } from './deleteService.uc'

const ordi = (groupId = 'g1'): Service =>
  serviceReconstitute(
    's1',
    groupId,
    labelReconstitute('Ordi'),
    dayReconstitute('2026-08-16'),
    amountReconstitute(50),
    'u2',
    ['u2'],
    [{ userId: 'u2', amount: amountReconstitute(50) }]
  )

const slate = (): GroupDto => ({
  id: 'g1',
  name: 'Potes de Bob',
  members: [{ userId: 'u1', name: 'Léa' }],
  invite: { secret: 'secret' },
  expenses: [],
  services: [],
  paybacks: [],
  balances: [{ userId: 'u1', name: 'Léa', amount: 0 }]
})

const repository = (deleted: string[], found: Service | null): ServiceRepository => ({
  save: async () => undefined,
  findById: async () => found,
  findByGroupId: async () => [],
  delete: async id => {
    deleted.push(id)
  }
})

describe('deleteService', () => {
  it('deletes the Service and returns the fresh slate', async () => {
    const deleted: string[] = []
    const calls: string[] = []
    const services = deleteService(repository(deleted, ordi()), {
      execute: async (userId, groupId) => {
        calls.push(`${userId}:${groupId}`)
        return slate()
      }
    })

    const result = await services.execute('u1', 'g1', 's1')

    expect(deleted).toEqual(['s1'])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slate())
  })

  it('refuses an unknown Service without deleting', async () => {
    const deleted: string[] = []
    const services = deleteService(repository(deleted, null), { execute: async () => slate() })

    const remove = services.execute('u1', 'g1', 'inconnu')

    await expect(remove).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Service introuvable'
    })
    expect(deleted).toEqual([])
  })

  it('refuses a Service of another Group without deleting', async () => {
    const deleted: string[] = []
    const services = deleteService(repository(deleted, ordi('g2')), {
      execute: async () => slate()
    })

    const remove = services.execute('u1', 'g1', 's1')

    await expect(remove).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Service introuvable'
    })
    expect(deleted).toEqual([])
  })
})
