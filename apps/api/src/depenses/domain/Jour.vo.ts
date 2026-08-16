import { InvalidData } from '../../domain/InvalidData.error.ts'

export class Jour {
  static readonly REQUIRED = 'Jour requis'

  private constructor(readonly value: string) {}

  static from(value: string) {
    const trimmed = value.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw new InvalidData(Jour.REQUIRED)
    }
    return new Jour(trimmed)
  }

  static reconstitute(value: string) {
    return new Jour(value)
  }

  equals(other: Jour) {
    return this.value === other.value
  }

  toString() {
    return this.value
  }
}
