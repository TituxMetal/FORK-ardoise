import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from '~/groups/application/group.dto'
import { amountReconstitute } from '~/shared/domain'
import { dayReconstitute } from '~/expenses/domain/day.vo'
import { labelReconstitute } from '~/expenses/domain/label.vo'
import { serviceReconstitute, type Service } from '~/services/domain/service.entity'
import type { ServiceRepository } from '~/services/domain/service.repository'
import { updateService } from './updateService.uc'

const ordi = (groupId = 'g1'): Service =>
  serviceReconstitute(
    's1',
    groupId,
    labelReconstitute('Ordi Bob'),
    dayReconstitute('2026-08-16'),
    amountReconstitute(50),
    'u2',
    ['u1', 'u2'],
    [
      { userId: 'u1', amount: amountReconstitute(25) },
      { userId: 'u2', amount: amountReconstitute(25) }
    ]
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
  paybacks: [],
  balances: [
    { userId: 'u1', name: 'Léa', amount: 0 },
    { userId: 'u2', name: 'Bob', amount: 0 }
  ]
})

const repository = (updated: Service[], found: Service | null): ServiceRepository => ({
  save: async () => undefined,
  findById: async () => found,
  findByGroupId: async () => [],
  update: async service => {
    updated.push(service)
  },
  delete: async () => undefined
})

describe('updateService', () => {
  it('updates the Service keeping the id and returns the fresh slate', async () => {
    const updated: Service[] = []
    const calls: string[] = []
    const services = updateService(repository(updated, ordi()), {
      execute: async (userId, groupId) => {
        calls.push(`${userId}:${groupId}`)
        return slate()
      }
    })

    const result = await services.execute('u1', 'g1', 's1', {
      label: 'Ordi Neuf',
      day: '2026-08-17',
      amount: 100,
      providerId: 'u2',
      participantIds: ['u1', 'u2']
    })

    expect(updated).toHaveLength(1)
    expect(updated[0]).toMatchObject({
      id: 's1',
      groupId: 'g1',
      label: { value: 'Ordi Neuf' },
      day: { value: '2026-08-17' },
      amount: { value: 100 },
      providerId: 'u2',
      participantIds: ['u1', 'u2']
    })
    expect(updated[0]?.parts.map(part => part.amount.value)).toEqual([50, 50])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slate())
  })

  it('keeps the existing Participants when the list is omitted', async () => {
    const updated: Service[] = []
    const services = updateService(repository(updated, ordi()), { execute: async () => slate() })

    await services.execute('u1', 'g1', 's1', {
      label: 'Ordi Bob',
      day: '2026-08-16',
      amount: 50,
      providerId: 'u2'
    })

    expect(updated[0]?.participantIds).toEqual(['u1', 'u2'])
  })

  it('refuses an unknown Service without updating', async () => {
    const updated: Service[] = []
    const services = updateService(repository(updated, null), { execute: async () => slate() })

    const edit = services.execute('u1', 'g1', 'inconnu', {
      label: 'Ordi Bob',
      day: '2026-08-16',
      amount: 50,
      providerId: 'u2'
    })

    await expect(edit).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Service introuvable'
    })
    expect(updated).toEqual([])
  })

  it('refuses a Service of another Group without updating', async () => {
    const updated: Service[] = []
    const services = updateService(repository(updated, ordi('g2')), {
      execute: async () => slate()
    })

    const edit = services.execute('u1', 'g1', 's1', {
      label: 'Ordi Bob',
      day: '2026-08-16',
      amount: 50,
      providerId: 'u2'
    })

    await expect(edit).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Service introuvable'
    })
    expect(updated).toEqual([])
  })

  it('refuses a Provider who is not a Member without updating', async () => {
    const updated: Service[] = []
    const services = updateService(repository(updated, ordi()), { execute: async () => slate() })

    const edit = services.execute('u1', 'g1', 's1', {
      label: 'Ordi Bob',
      day: '2026-08-16',
      amount: 50,
      providerId: 'u9'
    })

    await expect(edit).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: 'Membre introuvable'
    })
    expect(updated).toEqual([])
  })
})
