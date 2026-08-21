import { invalidData } from './invalidData.vo'
import { amountFromNonNegativeCents, type Amount } from './amount.vo'

export type Part = {
  userId: string
  amount: Amount
}

export const PARTICIPANTS_REQUIRED = 'Au moins un Participant requis'

export const equalParts = (
  amount: Amount,
  participantIds: string[],
  creditedId: string
): Part[] => {
  if (participantIds.length === 0) {
    throw invalidData(PARTICIPANTS_REQUIRED)
  }
  const whole = Math.floor(amount.value / participantIds.length)
  const remainder = amount.value - whole * participantIds.length
  const parts: Part[] = participantIds.map(userId => ({
    userId,
    amount: amountFromNonNegativeCents(userId === creditedId ? whole + remainder : whole)
  }))
  if (!participantIds.includes(creditedId) && remainder > 0) {
    parts.push({ userId: creditedId, amount: amountFromNonNegativeCents(remainder) })
  }
  return parts
}
