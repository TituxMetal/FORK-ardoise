import { InvalidData } from './InvalidData.error.ts'

export class Montant {
  static readonly POSITIVE = 'Montant en centimes > 0 requis'
  static readonly INTEGER = 'Montant en centimes entiers requis'

  private constructor(readonly value: number) {}

  static fromCents(cents: number) {
    if (!Number.isInteger(cents)) {
      throw new InvalidData(Montant.INTEGER)
    }
    if (cents <= 0) {
      throw new InvalidData(Montant.POSITIVE)
    }
    return new Montant(cents)
  }

  static fromNonNegativeCents(cents: number) {
    if (!Number.isInteger(cents)) {
      throw new InvalidData(Montant.INTEGER)
    }
    if (cents < 0) {
      throw new InvalidData(Montant.POSITIVE)
    }
    return new Montant(cents)
  }

  static fromEuros(euros: number) {
    const cents = euros * 100
    if (Math.abs(cents - Math.round(cents)) > 1e-8) {
      throw new InvalidData(Montant.INTEGER)
    }
    return Montant.fromCents(Math.round(cents))
  }

  static reconstitute(cents: number) {
    return new Montant(cents)
  }

  equals(other: Montant) {
    return this.value === other.value
  }

  toString() {
    return String(this.value)
  }
}
