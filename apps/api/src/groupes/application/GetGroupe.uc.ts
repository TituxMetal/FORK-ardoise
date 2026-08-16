import type { IDepenseRepository } from '../../depenses/domain/IDepense.repository.ts'
import { NotFound } from '../../domain/NotFound.error.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import type { IGroupeRepository } from '../domain/IGroupe.repository.ts'
import { toGroupeDto } from './ToGroupe.mapper.ts'

export class GetGroupe {
  constructor(
    private readonly groupes: IGroupeRepository,
    private readonly depenses: IDepenseRepository,
    private readonly services: IServiceRepository
  ) {}

  async execute(userId: string, groupeId: string) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw new NotFound('Groupe introuvable')
    }
    return toGroupeDto(
      groupe,
      await this.depenses.findByGroupeId(groupeId),
      await this.services.findByGroupeId(groupeId)
    )
  }
}
