import { z } from 'zod'
import type { UseFormReturn } from 'react-hook-form'
import { centsFromEuros, eurosAmountSchema } from '~/lib/amounts'

// The field shape the create and edit forms share. It validates the shape
// only: the Amount cap follows the effective debtor/creditor selection
// against the current Balances, which only the forms know at submit time, so
// the static resolver cannot enforce it — createPaybackSchema(cap) layers
// the cap rule on and the forms parse with it before submitting.
export const paybackFieldsSchema = z.object({
  // Empty string is the "auto" sentinel: an untouched select re-derives its
  // default from the current Balances (see PaybackForm), so these ids cannot
  // carry required-validation here. Membership is checked against the Slate
  // before submit; the API enforces the domain rule.
  day: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Jour requis'),
  debtorId: z.string(),
  creditorId: z.string(),
  amount: eurosAmountSchema
})

export type CreatePaybackFormInput = z.infer<typeof paybackFieldsSchema>

// The payback schema refined with the cap (in cents) of the effective
// debtor/creditor selection — the same derivation the forms use for the
// displayed "Plafond" hint — evaluated at submit time. The boundary is
// strict, mirroring the server rule: an Amount at the cap passes, only a
// strictly-above Amount is refused with the server's French message.
export const createPaybackSchema = (cap: number) =>
  paybackFieldsSchema.superRefine((values, ctx) => {
    if (centsFromEuros(values.amount) > cap) {
      ctx.addIssue({
        code: 'custom',
        path: ['amount'],
        message: 'Montant au-dessus du plafond'
      })
    }
  })

// The Amount cap follows the effective debtor/creditor selection the "Plafond"
// hint displays, which the static zodResolver cannot see, so the create and
// edit forms re-check the submitted values with createPaybackSchema(cap)
// before calling the API. Records the server's message on the Amount field
// and returns true when the submit is blocked.
export const enforcePaybackCap = (
  form: UseFormReturn<CreatePaybackFormInput>,
  cap: number,
  values: CreatePaybackFormInput
): boolean => {
  // A debtor with no debt has no repayment headroom; that selection is a
  // solvency/membership case the server arbitrates — out of scope for this
  // client mirror, which enforces only the cap of an in-debt selection.
  if (cap <= 0) {
    form.clearErrors('amount')
    return false
  }
  const capCheck = createPaybackSchema(cap).safeParse(values)
  if (capCheck.success) {
    // The Amount now passes — drop a stale cap error from an earlier rejected
    // submit so it does not linger on the corrected resubmit.
    form.clearErrors('amount')
    return false
  }
  form.setError('amount', { type: 'custom', message: capCheck.error.issues[0]?.message })
  return true
}
