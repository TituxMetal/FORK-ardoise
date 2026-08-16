import type { IDepenseRepository } from '../../depenses/domain/IDepense.repository.ts'
import { NotFound } from '../../domain/NotFound.error.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupeRepository } from '../../groupes/domain/IGroupe.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import type { IReglementRepository } from '../domain/IReglement.repository.ts'

export class DeleteReglement {
  constructor(
    private readonly groupes: IGroupeRepository,
    private readonly depenses: IDepenseRepository,
    private readonly services: IServiceRepository,
    private readonly reglements: IReglementRepository
  ) {}

  async execute(userId: string, groupeId: string, reglementId: string) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw new NotFound('Groupe introuvable')
    }
    const reglement = await this.reglements.findById(reglementId)
    if (!reglement || reglement.groupeId !== groupeId) {
      throw new NotFound('Règlement introuvable')
    }
    await this.reglements.delete(reglementId)
    return toGroupeDto(
      groupe,
      await this.depenses.findByGroupeId(groupeId),
      await this.services.findByGroupeId(groupeId),
      await this.reglements.findByGroupeId(groupeId)
    )
  }
}
