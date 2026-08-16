import { invalidData } from '../../domain/invalidData.ts'
import { type Amount } from '../../domain/Amount.ts'

export class Reglement {
  static readonly ABOVE_PLAFOND = 'Montant au-dessus du plafond'
  static readonly DEBTOR_NOT_NEGATIVE = 'Débiteur au Solde non négatif'
  static readonly CREDITOR_NOT_POSITIVE = 'Créancier au Solde non positif'

  private constructor(
    private readonly _id: string,
    private readonly _groupeId: string,
    private readonly _debtorId: string,
    private readonly _creditorId: string,
    private readonly _amount: Amount
  ) {}

  static plafond(debtorBalance: number, creditorBalance: number) {
    return Math.min(-debtorBalance, creditorBalance)
  }

  static create(
    groupeId: string,
    debtorId: string,
    creditorId: string,
    amount: Amount,
    debtorBalance: number,
    creditorBalance: number
  ) {
    if (debtorBalance >= 0) {
      throw invalidData(Reglement.DEBTOR_NOT_NEGATIVE)
    }
    if (creditorBalance <= 0) {
      throw invalidData(Reglement.CREDITOR_NOT_POSITIVE)
    }
    const plafond = Reglement.plafond(debtorBalance, creditorBalance)
    if (amount.value > plafond) {
      throw invalidData(Reglement.ABOVE_PLAFOND)
    }
    return new Reglement(crypto.randomUUID(), groupeId, debtorId, creditorId, amount)
  }

  static reconstitute(
    id: string,
    groupeId: string,
    debtorId: string,
    creditorId: string,
    amount: Amount
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
