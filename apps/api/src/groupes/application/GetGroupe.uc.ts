import type { IExpenseRepository } from '../../depenses/domain/IExpense.repository.ts'
import { notFound } from '../../domain/notFound.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import type { IGroupRepository } from '../domain/IGroup.repository.ts'
import { toGroupeDto } from './ToGroupe.mapper.ts'

export class GetGroupe {
  constructor(
    private readonly groupes: IGroupRepository,
    private readonly depenses: IExpenseRepository,
    private readonly services: IServiceRepository,
    private readonly paybacks: IPaybackRepository
  ) {}

  async execute(userId: string, groupeId: string) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw notFound('Groupe introuvable')
    }
    return toGroupeDto(
      groupe,
      await this.depenses.findByGroupeId(groupeId),
      await this.services.findByGroupeId(groupeId),
      await this.paybacks.findByGroupeId(groupeId)
    )
  }
}
