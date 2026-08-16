import { Jour } from '../../depenses/domain/Jour.vo.ts'
import { Libelle } from '../../depenses/domain/Libelle.vo.ts'
import { Montant } from '../../domain/Montant.vo.ts'
import { Parts } from '../../domain/Parts.ts'

export class Service {
  private constructor(
    private readonly _id: string,
    private readonly _groupeId: string,
    private readonly _label: Libelle,
    private readonly _day: Jour,
    private readonly _amount: Montant,
    private readonly _providerId: string,
    private readonly _participantIds: string[],
    private readonly _parts: Parts
  ) {}

  static create(
    groupeId: string,
    label: Libelle,
    day: Jour,
    amount: Montant,
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
      Parts.equal(amount, participantIds, providerId)
    )
  }

  static reconstitute(
    id: string,
    groupeId: string,
    label: Libelle,
    day: Jour,
    amount: Montant,
    providerId: string,
    participantIds: string[],
    parts: Parts
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
