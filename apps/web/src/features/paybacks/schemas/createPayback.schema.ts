import { z } from 'zod'
import { eurosAmountSchema } from '~/lib/amounts'

export const createPaybackSchema = z.object({
  // Empty string is the "auto" sentinel: an untouched select re-derives its
  // default from the current Balances (see PaybackForm), so these ids cannot
  // carry required-validation here. Membership is checked against the Slate
  // before submit; the API enforces the domain rule.
  debtorId: z.string(),
  creditorId: z.string(),
  amount: eurosAmountSchema
})

export type CreatePaybackFormInput = z.infer<typeof createPaybackSchema>
