import { Montant } from '../../domain/Montant.vo.ts'
import { Parts } from '../../domain/Parts.ts'
import { Jour } from './Jour.vo.ts'
import { Libelle } from './Libelle.vo.ts'

export class Depense {
  private constructor(
    private readonly _id: string,
    private readonly _groupeId: string,
    private readonly _label: Libelle,
    private readonly _day: Jour,
    private readonly _amount: Montant,
    private readonly _payerId: string,
    private readonly _participantIds: string[],
    private readonly _parts: Parts
  ) {}

  static create(
    groupeId: string,
    label: Libelle,
    day: Jour,
    amount: Montant,
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
      Parts.equal(amount, participantIds, payerId)
    )
  }

  static reconstitute(
    id: string,
    groupeId: string,
    label: Libelle,
    day: Jour,
    amount: Montant,
    payerId: string,
    participantIds: string[],
    parts: Parts
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
