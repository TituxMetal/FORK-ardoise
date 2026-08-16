import { amountFromCents } from '../../domain/Amount.ts'
import { invalidData } from '../../domain/invalidData.ts'
import { notFound } from '../../domain/notFound.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../reglements/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { Depense } from '../domain/Depense.entity.ts'
import type { IExpenseRepository } from '../domain/IExpense.repository.ts'
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
    private readonly groupes: IGroupRepository,
    private readonly depenses: IExpenseRepository,
    private readonly services: IServiceRepository,
    private readonly reglements: IPaybackRepository
  ) {}

  async execute(userId: string, groupeId: string, input: CreateDepenseInput) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw notFound('Groupe introuvable')
    }
    const participantIds = input.participantIds ?? groupe.membres.map(membre => membre.userId)
    if (!groupe.hasMembre(input.payerId) || participantIds.some(id => !groupe.hasMembre(id))) {
      throw invalidData('Membre introuvable')
    }
    const depense = Depense.create(
      groupeId,
      Libelle.from(input.label),
      Jour.from(input.day),
      amountFromCents(input.amount),
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
