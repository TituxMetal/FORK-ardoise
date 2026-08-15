import { NotFound } from '../../domain/NotFound.error.ts'
import type { IGroupeRepository } from '../domain/IGroupe.repository.ts'
import { toGroupeDto } from './ToGroupe.mapper.ts'

export class GetGroupe {
  constructor(private readonly groupes: IGroupeRepository) {}

  async execute(userId: string, groupeId: string) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw new NotFound('Groupe introuvable')
    }
    return toGroupeDto(groupe)
  }
}
