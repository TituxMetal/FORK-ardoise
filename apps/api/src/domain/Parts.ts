import { InvalidData } from './InvalidData.error.ts'
import { Montant } from './Montant.vo.ts'

export type Part = {
  userId: string
  amount: Montant
}

export class Parts {
  static readonly PARTICIPANTS_REQUIRED = 'Au moins un Participant requis'

  private constructor(readonly list: Part[]) {}

  static equal(montant: Montant, participantIds: string[], payerId: string) {
    if (participantIds.length === 0) {
      throw new InvalidData(Parts.PARTICIPANTS_REQUIRED)
    }
    const partEntiere = Math.floor(montant.value / participantIds.length)
    const reste = montant.value - partEntiere * participantIds.length
    const list: Part[] = participantIds.map(userId => ({
      userId,
      amount: Montant.fromNonNegativeCents(userId === payerId ? partEntiere + reste : partEntiere)
    }))
    if (!participantIds.includes(payerId) && reste > 0) {
      list.push({ userId: payerId, amount: Montant.fromNonNegativeCents(reste) })
    }
    return new Parts(list)
  }

  static reconstitute(list: Part[]) {
    return new Parts(list)
  }
}
