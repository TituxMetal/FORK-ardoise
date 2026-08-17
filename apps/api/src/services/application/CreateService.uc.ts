import { dayFrom } from '../../expenses/domain/Day.vo.ts'
import { labelFrom } from '../../expenses/domain/Label.vo.ts'
import type { IExpenseRepository } from '../../expenses/domain/IExpense.repository.ts'
import { amountFromCents } from '../../domain/Amount.ts'
import { invalidData } from '../../domain/invalidData.ts'
import { notFound } from '../../domain/notFound.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
import { serviceCreate } from '../domain/Service.entity.ts'
import type { IServiceRepository } from '../domain/IService.repository.ts'

export type CreateServiceInput = {
  label: string
  day: string
  amount: number
  providerId: string
  participantIds?: string[]
}

export const createService = (
  groupes: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupeId: string, input: CreateServiceInput) => {
    const groupe = await groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw notFound('Groupe introuvable')
    }
    const participantIds = input.participantIds ?? groupe.membres.map(membre => membre.userId)
    if (!groupe.hasMembre(input.providerId) || participantIds.some(id => !groupe.hasMembre(id))) {
      throw invalidData('Membre introuvable')
    }
    const service = serviceCreate(
      groupeId,
      labelFrom(input.label),
      dayFrom(input.day),
      amountFromCents(input.amount),
      input.providerId,
      participantIds
    )
    await services.save(service)
    return toGroupeDto(
      groupe,
      await expenses.findByGroupeId(groupeId),
      await services.findByGroupeId(groupeId),
      await paybacks.findByGroupeId(groupeId)
    )
  }
})
