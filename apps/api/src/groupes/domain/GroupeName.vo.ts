import { InvalidData } from '../../domain/InvalidData.error.ts'

export class GroupeName {
  private constructor(readonly value: string) {}

  static from(value: string) {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      throw new InvalidData('Nom du Groupe requis')
    }
    return new GroupeName(trimmed)
  }

  static reconstitute(value: string) {
    return new GroupeName(value)
  }

  equals(other: GroupeName) {
    return this.value === other.value
  }

  toString() {
    return this.value
  }
}
