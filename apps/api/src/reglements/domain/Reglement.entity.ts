import { InvalidData } from '../../domain/InvalidData.error.ts'
import { Montant } from '../../domain/Montant.vo.ts'

export class Reglement {
  static readonly ABOVE_PLAFOND = 'Montant au-dessus du plafond'
  static readonly DEBTOR_NOT_NEGATIVE = 'Débiteur au Solde non négatif'
  static readonly CREDITOR_NOT_POSITIVE = 'Créancier au Solde non positif'

  private constructor(
    private readonly _id: string,
    private readonly _groupeId: string,
    private readonly _debtorId: string,
    private readonly _creditorId: string,
    private readonly _amount: Montant
  ) {}

  static plafond(soldeDebiteur: number, soldeCreancier: number) {
    return Math.min(-soldeDebiteur, soldeCreancier)
  }

  static create(
    groupeId: string,
    debtorId: string,
    creditorId: string,
    amount: Montant,
    soldeDebiteur: number,
    soldeCreancier: number
  ) {
    if (soldeDebiteur >= 0) {
      throw new InvalidData(Reglement.DEBTOR_NOT_NEGATIVE)
    }
    if (soldeCreancier <= 0) {
      throw new InvalidData(Reglement.CREDITOR_NOT_POSITIVE)
    }
    const plafond = Reglement.plafond(soldeDebiteur, soldeCreancier)
    if (amount.value > plafond) {
      throw new InvalidData(Reglement.ABOVE_PLAFOND)
    }
    return new Reglement(crypto.randomUUID(), groupeId, debtorId, creditorId, amount)
  }

  static reconstitute(
    id: string,
    groupeId: string,
    debtorId: string,
    creditorId: string,
    amount: Montant
  ) {
    return new Reglement(id, groupeId, debtorId, creditorId, amount)
  }

  get id() {
    return this._id
  }

  get groupeId() {
    return this._groupeId
  }

  get debtorId() {
    return this._debtorId
  }

  get creditorId() {
    return this._creditorId
  }

  get amount() {
    return this._amount
  }
}
