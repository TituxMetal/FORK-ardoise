import { InvalidData } from '../../domain/InvalidData.error.ts'

export class Libelle {
  static readonly REQUIRED = 'Libellé requis'

  private constructor(readonly value: string) {}

  static from(value: string) {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      throw new InvalidData(Libelle.REQUIRED)
    }
    return new Libelle(trimmed)
  }

  static reconstitute(value: string) {
    return new Libelle(value)
  }

  equals(other: Libelle) {
    return this.value === other.value
  }

  toString() {
    return this.value
  }
}
