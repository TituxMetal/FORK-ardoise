import type { IExpenseRepository } from '../../depenses/domain/IExpense.repository.ts'
import { notFound } from '../../domain/notFound.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../reglements/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../domain/IService.repository.ts'

export class DeleteService {
  constructor(
    private readonly groupes: IGroupRepository,
    private readonly depenses: IExpenseRepository,
    private readonly services: IServiceRepository,
    private readonly reglements: IPaybackRepository
  ) {}

  async execute(userId: string, groupeId: string, serviceId: string) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw notFound('Groupe introuvable')
    }
    const service = await this.services.findById(serviceId)
    if (!service || service.groupeId !== groupeId) {
      throw notFound('Service introuvable')
    }
    await this.services.delete(serviceId)
    return toGroupeDto(
      groupe,
      await this.depenses.findByGroupeId(groupeId),
      await this.services.findByGroupeId(groupeId),
      await this.reglements.findByGroupeId(groupeId)
    )
  }
}
