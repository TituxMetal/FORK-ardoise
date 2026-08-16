import { Jour } from '../../depenses/domain/Jour.vo.ts'
import { Libelle } from '../../depenses/domain/Libelle.vo.ts'
import type { IDepenseRepository } from '../../depenses/domain/IDepense.repository.ts'
import { InvalidData } from '../../domain/InvalidData.error.ts'
import { Montant } from '../../domain/Montant.vo.ts'
import { NotFound } from '../../domain/NotFound.error.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupeRepository } from '../../groupes/domain/IGroupe.repository.ts'
import type { IReglementRepository } from '../../reglements/domain/IReglement.repository.ts'
import type { IServiceRepository } from '../domain/IService.repository.ts'
import { Service } from '../domain/Service.entity.ts'

export type CreateServiceInput = {
  label: string
  day: string
  amount: number
  providerId: string
  participantIds?: string[]
}

export class CreateService {
  constructor(
    private readonly groupes: IGroupeRepository,
    private readonly depenses: IDepenseRepository,
    private readonly services: IServiceRepository,
    private readonly reglements: IReglementRepository
  ) {}

  async execute(userId: string, groupeId: string, input: CreateServiceInput) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw new NotFound('Groupe introuvable')
    }
    const participantIds = input.participantIds ?? groupe.membres.map(membre => membre.userId)
    if (!groupe.hasMembre(input.providerId) || participantIds.some(id => !groupe.hasMembre(id))) {
      throw new InvalidData('Membre introuvable')
    }
    const service = Service.create(
      groupeId,
      Libelle.from(input.label),
      Jour.from(input.day),
      Montant.fromCents(input.amount),
      input.providerId,
      participantIds
    )
    await this.services.save(service)
    return toGroupeDto(
      groupe,
      await this.depenses.findByGroupeId(groupeId),
      await this.services.findByGroupeId(groupeId),
      await this.reglements.findByGroupeId(groupeId)
    )
  }
}
