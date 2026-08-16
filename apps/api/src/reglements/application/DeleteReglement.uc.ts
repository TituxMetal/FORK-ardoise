import type { IExpenseRepository } from '../../depenses/domain/IExpense.repository.ts'
import { notFound } from '../../domain/notFound.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import type { IPaybackRepository } from '../domain/IPayback.repository.ts'

export class DeleteReglement {
  constructor(
    private readonly groupes: IGroupRepository,
    private readonly depenses: IExpenseRepository,
    private readonly services: IServiceRepository,
    private readonly reglements: IPaybackRepository
  ) {}

  async execute(userId: string, groupeId: string, reglementId: string) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw notFound('Groupe introuvable')
    }
    const reglement = await this.reglements.findById(reglementId)
    if (!reglement || reglement.groupeId !== groupeId) {
      throw notFound('Règlement introuvable')
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
