import type { Payback } from '~/paybacks/domain/payback.entity'

export const PaybackRepository = Symbol('PaybackRepository')

export type PaybackRepository = {
  save: (payback: Payback) => Promise<void>
  findById: (id: string) => Promise<Payback | null>
  findByGroupId: (groupId: string) => Promise<Payback[]>
  delete: (id: string) => Promise<void>
}
