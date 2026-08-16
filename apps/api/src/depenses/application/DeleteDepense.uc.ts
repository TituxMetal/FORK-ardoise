import { NotFound } from '../../domain/NotFound.error.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../reglements/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import type { IExpenseRepository } from '../domain/IExpense.repository.ts'

export class DeleteDepense {
  constructor(
    private readonly groupes: IGroupRepository,
    private readonly depenses: IExpenseRepository,
    private readonly services: IServiceRepository,
    private readonly reglements: IPaybackRepository
  ) {}

  async execute(userId: string, groupeId: string, depenseId: string) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw new NotFound('Groupe introuvable')
    }
    const depense = await this.depenses.findById(depenseId)
    if (!depense || depense.groupeId !== groupeId) {
      throw new NotFound('Dépense introuvable')
    }
    await this.depenses.delete(depenseId)
    return toGroupeDto(
      groupe,
      await this.depenses.findByGroupeId(groupeId),
      await this.services.findByGroupeId(groupeId),
      await this.reglements.findByGroupeId(groupeId)
    )
  }
}
