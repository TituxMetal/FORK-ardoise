import type { IExpenseRepository } from '../../depenses/domain/IExpense.repository.ts'
import { NotFound } from '../../domain/NotFound.error.ts'
import type { IPaybackRepository } from '../../reglements/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import type { IGroupRepository } from '../domain/IGroup.repository.ts'
import { toGroupeDto } from './ToGroupe.mapper.ts'

export class GetGroupe {
  constructor(
    private readonly groupes: IGroupRepository,
    private readonly depenses: IExpenseRepository,
    private readonly services: IServiceRepository,
    private readonly reglements: IPaybackRepository
  ) {}

  async execute(userId: string, groupeId: string) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw new NotFound('Groupe introuvable')
    }
    return toGroupeDto(
      groupe,
      await this.depenses.findByGroupeId(groupeId),
      await this.services.findByGroupeId(groupeId),
      await this.reglements.findByGroupeId(groupeId)
    )
  }
}
