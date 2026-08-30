import { describe, expect, it } from 'vite-plus/test'
import type { GroupDto } from '~/groups/application/group.dto'
import type { Service } from '~/services/domain/service.entity'
import type { ServiceRepository } from '~/services/domain/service.repository'
import { LABEL_REQUIRED } from '~/expenses/domain/label.vo'
import { PARTICIPANTS_REQUIRED } from '~/shared/domain'
import { createService } from './createService.uc'

const members = [
  { userId: 'u1', name: 'Léa' },
  { userId: 'u2', name: 'Bob' }
]

const slate = (): GroupDto => ({
  id: 'g1',
  name: 'Potes de Bob',
  selfMemberId: 'u1',
  members,
  invite: { secret: 'secret' },
  expenses: [],
  services: [],
  paybacks: [],
  balances: members.map(member => ({ ...member, amount: 0 }))
})

const repository = (saved: Service[] = []): ServiceRepository => ({
  save: async service => {
    saved.push(service)
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

describe('createService', () => {
  it('saves the Service and returns the fresh slate', async () => {
    const saved: Service[] = []
    const calls: string[] = []
    const services = createService(repository(saved), view(calls))

    const result = await services.execute('u1', 'g1', {
      label: '  Ordi  ',
      day: '2026-08-16',
      amount: 50,
      providerId: 'u2',
      participantIds: ['u1', 'u2']
    })

    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      groupId: 'g1',
      label: { value: 'Ordi' },
      day: { value: '2026-08-16' },
      amount: { value: 50 },
      providerId: 'u2',
      participantIds: ['u1', 'u2']
    })
    expect(saved[0]?.parts.map(part => part.amount.value)).toEqual([25, 25])
    expect(calls).toEqual(['u1:g1', 'u1:g1'])
    expect(result).toEqual(slate())
  })

  it('defaults omitted Participants to every Member', async () => {
    const saved: Service[] = []
    const services = createService(repository(saved), view([]))

    await services.execute('u1', 'g1', {
      label: 'Ordi',
      day: '2026-08-16',
      amount: 50,
      providerId: 'u2'
    })

    expect(saved[0]?.participantIds).toEqual(['u1', 'u2'])
  })

  it('refuses a Provider who is not a Member', async () => {
    const saved: Service[] = []
    const services = createService(repository(saved), view([]))

    const create = services.execute('u1', 'g1', {
      label: 'Ordi',
      day: '2026-08-16',
      amount: 50,
      providerId: 'u9'
    })

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: 'Membre introuvable'
    })
    expect(saved).toEqual([])
  })

  it('refuses an empty Participant list', async () => {
    const saved: Service[] = []
    const services = createService(repository(saved), view([]))

    const create = services.execute('u1', 'g1', {
      label: 'Ordi',
      day: '2026-08-16',
      amount: 50,
      providerId: 'u2',
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
    const services = createService(repository(saved), view([]))

    const create = services.execute('u1', 'g1', {
      label: '   ',
      day: '2026-08-16',
      amount: 50,
      providerId: 'u2'
    })

    await expect(create).rejects.toMatchObject({
      code: 'INVALID_DATA',
      message: LABEL_REQUIRED
    })
    expect(saved).toEqual([])
  })
})
