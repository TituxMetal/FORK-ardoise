import type { Day } from '../../expenses/domain/Day.vo.ts'
import type { Label } from '../../expenses/domain/Label.vo.ts'
import type { Amount } from '../../domain/Amount.ts'
import { equalParts, type Part } from '../../domain/Part.ts'

export class Service {
  private constructor(
    private readonly _id: string,
    private readonly _groupeId: string,
    private readonly _label: Label,
    private readonly _day: Day,
    private readonly _amount: Amount,
    private readonly _providerId: string,
    private readonly _participantIds: string[],
    private readonly _parts: Part[]
  ) {}

  static create(
    groupeId: string,
    label: Label,
    day: Day,
    amount: Amount,
    providerId: string,
    participantIds: string[]
  ) {
    return new Service(
      crypto.randomUUID(),
      groupeId,
      label,
      day,
      amount,
      providerId,
      participantIds,
      equalParts(amount, participantIds, providerId)
    )
  }

  static reconstitute(
    id: string,
    groupeId: string,
    label: Label,
    day: Day,
    amount: Amount,
    providerId: string,
    participantIds: string[],
    parts: Part[]
  ) {
    return new Service(id, groupeId, label, day, amount, providerId, participantIds, parts)
  }

  get id() {
    return this._id
  }

  get groupeId() {
    return this._groupeId
  }

  get label() {
    return this._label
  }

  get day() {
    return this._day
  }

  get amount() {
    return this._amount
  }

  get providerId() {
    return this._providerId
  }

  get participantIds() {
    return [...this._participantIds]
  }

  get parts() {
    return this._parts
  }
}
