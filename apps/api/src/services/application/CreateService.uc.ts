import { Jour } from '../../depenses/domain/Jour.vo.ts'
import { Libelle } from '../../depenses/domain/Libelle.vo.ts'
import type { IExpenseRepository } from '../../depenses/domain/IExpense.repository.ts'
import { amountFromCents } from '../../domain/Amount.ts'
import { invalidData } from '../../domain/invalidData.ts'
import { notFound } from '../../domain/notFound.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
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
    private readonly groupes: IGroupRepository,
    private readonly depenses: IExpenseRepository,
    private readonly services: IServiceRepository,
    private readonly paybacks: IPaybackRepository
  ) {}

  async execute(userId: string, groupeId: string, input: CreateServiceInput) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw notFound('Groupe introuvable')
    }
    const participantIds = input.participantIds ?? groupe.membres.map(membre => membre.userId)
    if (!groupe.hasMembre(input.providerId) || participantIds.some(id => !groupe.hasMembre(id))) {
      throw invalidData('Membre introuvable')
    }
    const service = Service.create(
      groupeId,
      Libelle.from(input.label),
      Jour.from(input.day),
      amountFromCents(input.amount),
      input.providerId,
      participantIds
    )
    await this.services.save(service)
    return toGroupeDto(
      groupe,
      await this.depenses.findByGroupeId(groupeId),
      await this.services.findByGroupeId(groupeId),
      await this.paybacks.findByGroupeId(groupeId)
    )
  }
}
