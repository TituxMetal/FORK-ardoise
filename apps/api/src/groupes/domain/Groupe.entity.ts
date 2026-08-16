import { GroupeName } from './GroupeName.vo.ts'
import { Membre } from './Membre.entity.ts'

export class Groupe {
  private constructor(
    private readonly _id: string,
    private readonly _name: GroupeName,
    private readonly _membres: Membre[],
    private readonly _invitationSecret: string
  ) {}

  static create(name: GroupeName, creator: Membre) {
    return new Groupe(crypto.randomUUID(), name, [creator], crypto.randomUUID())
  }

  static reconstitute(id: string, name: GroupeName, membres: Membre[], invitationSecret: string) {
    return new Groupe(id, name, membres, invitationSecret)
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

  get invitationSecret() {
    return this._invitationSecret
  }

  hasMembre(userId: string) {
    return this._membres.some(membre => membre.userId === userId)
  }

  addMembre(membre: Membre) {
    if (this.hasMembre(membre.userId)) {
      return
    }
    this._membres.push(membre)
  }
}
