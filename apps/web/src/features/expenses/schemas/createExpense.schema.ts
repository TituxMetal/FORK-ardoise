import { z } from 'zod'
import { eurosAmountSchema } from '~/lib/amounts'

export const createExpenseSchema = z.object({
  label: z.string().trim().min(1, 'Libellé requis'),
  day: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Jour requis'),
  amount: eurosAmountSchema,
  payerId: z.string().min(1, 'Payeur requis'),
  participantIds: z.array(z.string()).optional()
})

export type CreateExpenseFormInput = z.infer<typeof createExpenseSchema>
