import type { IExpenseRepository } from '../../expenses/domain/IExpense.repository.ts'
import { notFound } from '../../domain/notFound.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../paybacks/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../domain/IService.repository.ts'

export const deleteService = (
  groupes: IGroupRepository,
  expenses: IExpenseRepository,
  services: IServiceRepository,
  paybacks: IPaybackRepository
) => ({
  execute: async (userId: string, groupeId: string, serviceId: string) => {
    const groupe = await groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw notFound('Groupe introuvable')
    }
    const service = await services.findById(serviceId)
    if (!service || service.groupeId !== groupeId) {
      throw notFound('Service introuvable')
    }
    await services.delete(serviceId)
    return toGroupeDto(
      groupe,
      await expenses.findByGroupeId(groupeId),
      await services.findByGroupeId(groupeId),
      await paybacks.findByGroupeId(groupeId)
    )
  }
})
