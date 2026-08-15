export class Membre {
  private constructor(
    private readonly _userId: string,
    private readonly _name: string
  ) {}

  static of(userId: string, name: string) {
    return new Membre(userId, name)
  }

  static reconstitute(userId: string, name: string) {
    return new Membre(userId, name)
  }

  get userId() {
    return this._userId
  }

  get name() {
    return this._name
  }
}
