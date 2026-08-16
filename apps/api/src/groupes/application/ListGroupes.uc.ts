import type { IGroupRepository } from '../domain/IGroup.repository.ts'

export class ListGroupes {
  constructor(private readonly groupes: IGroupRepository) {}

  async execute(userId: string) {
    const groupes = await this.groupes.findByUserId(userId)
    return groupes.map(groupe => ({
      id: groupe.id,
      name: groupe.name.value
    }))
  }
}
