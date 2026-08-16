import type { Amount } from '../../domain/Amount.ts'
import { equalParts, type Part } from '../../domain/Part.ts'
import { Jour } from './Jour.vo.ts'
import { Libelle } from './Libelle.vo.ts'

export class Depense {
  private constructor(
    private readonly _id: string,
    private readonly _groupeId: string,
    private readonly _label: Libelle,
    private readonly _day: Jour,
    private readonly _amount: Amount,
    private readonly _payerId: string,
    private readonly _participantIds: string[],
    private readonly _parts: Part[]
  ) {}

  static create(
    groupeId: string,
    label: Libelle,
    day: Jour,
    amount: Amount,
    payerId: string,
    participantIds: string[]
  ) {
    return new Depense(
      crypto.randomUUID(),
      groupeId,
      label,
      day,
      amount,
      payerId,
      participantIds,
      equalParts(amount, participantIds, payerId)
    )
  }

  static reconstitute(
    id: string,
    groupeId: string,
    label: Libelle,
    day: Jour,
    amount: Amount,
    payerId: string,
    participantIds: string[],
    parts: Part[]
  ) {
    return new Depense(id, groupeId, label, day, amount, payerId, participantIds, parts)
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

  get payerId() {
    return this._payerId
  }

  get participantIds() {
    return [...this._participantIds]
  }

  get parts() {
    return this._parts
  }
}
