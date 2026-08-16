import { InvalidData } from '../../domain/InvalidData.error.ts'
import { Montant } from '../../domain/Montant.vo.ts'
import { NotFound } from '../../domain/NotFound.error.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupeRepository } from '../../groupes/domain/IGroupe.repository.ts'
import type { IReglementRepository } from '../../reglements/domain/IReglement.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { Depense } from '../domain/Depense.entity.ts'
import type { IDepenseRepository } from '../domain/IDepense.repository.ts'
import { Jour } from '../domain/Jour.vo.ts'
import { Libelle } from '../domain/Libelle.vo.ts'

export type CreateDepenseInput = {
  label: string
  day: string
  amount: number
  payerId: string
  participantIds?: string[]
}

export class CreateDepense {
  constructor(
    private readonly groupes: IGroupeRepository,
    private readonly depenses: IDepenseRepository,
    private readonly services: IServiceRepository,
    private readonly reglements: IReglementRepository
  ) {}

  async execute(userId: string, groupeId: string, input: CreateDepenseInput) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw new NotFound('Groupe introuvable')
    }
    const participantIds = input.participantIds ?? groupe.membres.map(membre => membre.userId)
    if (!groupe.hasMembre(input.payerId) || participantIds.some(id => !groupe.hasMembre(id))) {
      throw new InvalidData('Membre introuvable')
    }
    const depense = Depense.create(
      groupeId,
      Libelle.from(input.label),
      Jour.from(input.day),
      Montant.fromCents(input.amount),
      input.payerId,
      participantIds
    )
    await this.depenses.save(depense)
    return toGroupeDto(
      groupe,
      await this.depenses.findByGroupeId(groupeId),
      await this.services.findByGroupeId(groupeId),
      await this.reglements.findByGroupeId(groupeId)
    )
  }
}
