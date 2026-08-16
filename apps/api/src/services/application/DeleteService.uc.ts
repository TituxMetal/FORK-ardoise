import type { IDepenseRepository } from '../../depenses/domain/IDepense.repository.ts'
import { NotFound } from '../../domain/NotFound.error.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupeRepository } from '../../groupes/domain/IGroupe.repository.ts'
import type { IServiceRepository } from '../domain/IService.repository.ts'

export class DeleteService {
  constructor(
    private readonly groupes: IGroupeRepository,
    private readonly depenses: IDepenseRepository,
    private readonly services: IServiceRepository
  ) {}

  async execute(userId: string, groupeId: string, serviceId: string) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw new NotFound('Groupe introuvable')
    }
    const service = await this.services.findById(serviceId)
    if (!service || service.groupeId !== groupeId) {
      throw new NotFound('Service introuvable')
    }
    await this.services.delete(serviceId)
    return toGroupeDto(
      groupe,
      await this.depenses.findByGroupeId(groupeId),
      await this.services.findByGroupeId(groupeId)
    )
  }
}
