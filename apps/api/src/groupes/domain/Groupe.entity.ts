import { GroupeName } from './GroupeName.vo.ts'
import { Membre } from './Membre.entity.ts'

export class Groupe {
  private constructor(
    private readonly _id: string,
    private readonly _name: GroupeName,
    private readonly _membres: Membre[]
  ) {}

  static create(name: GroupeName, creator: Membre) {
    return new Groupe(crypto.randomUUID(), name, [creator])
  }

  static reconstitute(id: string, name: GroupeName, membres: Membre[]) {
    return new Groupe(id, name, membres)
  }

  get id() {
    return this._id
  }

  get name() {
    return this._name
  }

  get membres() {
    return [...this._membres]
  }

  hasMembre(userId: string) {
    return this._membres.some(membre => membre.userId === userId)
  }
}
