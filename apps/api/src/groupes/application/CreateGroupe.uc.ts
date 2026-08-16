import { Groupe } from '../domain/Groupe.entity.ts'
import { GroupeName } from '../domain/GroupeName.vo.ts'
import type { IGroupRepository } from '../domain/IGroup.repository.ts'
import { Membre } from '../domain/Membre.entity.ts'
import { toGroupeDto } from './ToGroupe.mapper.ts'

export class CreateGroupe {
  constructor(private readonly groupes: IGroupRepository) {}

  async execute(userId: string, userName: string, name: string) {
    const groupe = Groupe.create(GroupeName.from(name), Membre.of(userId, userName))
    await this.groupes.save(groupe)
    return toGroupeDto(groupe)
  }
}
