import type { Payback } from '~/paybacks/domain/payback.entity'

export const PaybackRepository = Symbol('PaybackRepository')

export type PaybackRepository = {
  save: (payback: Payback) => Promise<void>
  findById: (id: string) => Promise<Payback | null>
  findByGroupId: (groupId: string) => Promise<Payback[]>
  /** Replaces an existing Payback; the caller validated membership and the cap rule. */
  update: (payback: Payback) => Promise<void>
  delete: (id: string) => Promise<void>
}
