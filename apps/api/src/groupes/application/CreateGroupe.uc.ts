import { Groupe } from '../domain/Groupe.entity.ts'
import { GroupeName } from '../domain/GroupeName.vo.ts'
import type { IGroupeRepository } from '../domain/IGroupe.repository.ts'
import { Membre } from '../domain/Membre.entity.ts'
import { toGroupeDto } from './ToGroupe.mapper.ts'

export class CreateGroupe {
  constructor(private readonly groupes: IGroupeRepository) {}

  async execute(userId: string, userName: string, name: string) {
    const groupe = Groupe.create(GroupeName.from(name), Membre.of(userId, userName))
    await this.groupes.save(groupe)
    return toGroupeDto(groupe)
  }
}
