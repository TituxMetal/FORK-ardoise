import type { IGroupeRepository } from '../domain/IGroupe.repository.ts'

export class ListGroupes {
  constructor(private readonly groupes: IGroupeRepository) {}

  async execute(userId: string) {
    const groupes = await this.groupes.findByUserId(userId)
    return groupes.map(groupe => ({
      id: groupe.id,
      name: groupe.name.value
    }))
  }
}
