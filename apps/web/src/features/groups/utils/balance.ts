import { euros } from '~/lib/amounts'

// The self-balance hero wording: the Group owes the self when the Balance is
// positive, the self owes the Group when it is negative.
export const selfBalanceLabel = (cents: number) =>
  cents >= 0 ? `On te doit ${euros(cents)}` : `Tu dois ${euros(Math.abs(cents))}`
