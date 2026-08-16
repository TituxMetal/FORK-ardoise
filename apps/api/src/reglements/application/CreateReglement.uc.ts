import { amountFromCents } from '../../domain/Amount.ts'
import { balancesOf } from '../../domain/Balance.ts'
import { invalidData } from '../../domain/invalidData.ts'
import { notFound } from '../../domain/notFound.ts'
import type { IExpenseRepository } from '../../depenses/domain/IExpense.repository.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { Reglement } from '../domain/Reglement.entity.ts'
import type { IPaybackRepository } from '../domain/IPayback.repository.ts'

export type CreateReglementInput = {
  debtorId: string
  creditorId: string
  amount: number
}

export class CreateReglement {
  constructor(
    private readonly groupes: IGroupRepository,
    private readonly depenses: IExpenseRepository,
    private readonly services: IServiceRepository,
    private readonly reglements: IPaybackRepository
  ) {}

  async execute(userId: string, groupeId: string, input: CreateReglementInput) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw notFound('Groupe introuvable')
    }
    if (!groupe.hasMembre(input.debtorId) || !groupe.hasMembre(input.creditorId)) {
      throw invalidData('Membre introuvable')
    }
    const depenses = await this.depenses.findByGroupeId(groupeId)
    const services = await this.services.findByGroupeId(groupeId)
    const existing = await this.reglements.findByGroupeId(groupeId)
    const balances = balancesOf(
      groupe.membres.map(membre => ({ userId: membre.userId, name: membre.name })),
      depenses.map(depense => ({
        payerId: depense.payerId,
        amount: depense.amount.value,
        parts: depense.parts
      })),
      services.map(service => ({
        providerId: service.providerId,
        amount: service.amount.value,
        parts: service.parts
      })),
      existing.map(reglement => ({
        debtorId: reglement.debtorId,
        creditorId: reglement.creditorId,
        amount: reglement.amount.value
      }))
    )
    const debtorBalance = balances.find(balance => balance.userId === input.debtorId)?.amount ?? 0
    const creditorBalance =
      balances.find(balance => balance.userId === input.creditorId)?.amount ?? 0
    const reglement = Reglement.create(
      groupeId,
      input.debtorId,
      input.creditorId,
      amountFromCents(input.amount),
      debtorBalance,
      creditorBalance
    )
    await this.reglements.save(reglement)
    return toGroupeDto(groupe, depenses, services, [...existing, reglement])
  }
}
