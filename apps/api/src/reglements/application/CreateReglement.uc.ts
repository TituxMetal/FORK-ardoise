import { InvalidData } from '../../domain/InvalidData.error.ts'
import { Montant } from '../../domain/Montant.vo.ts'
import { NotFound } from '../../domain/NotFound.error.ts'
import { soldesOf } from '../../domain/Solde.ts'
import type { IDepenseRepository } from '../../depenses/domain/IDepense.repository.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupeRepository } from '../../groupes/domain/IGroupe.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { Reglement } from '../domain/Reglement.entity.ts'
import type { IReglementRepository } from '../domain/IReglement.repository.ts'

export type CreateReglementInput = {
  debtorId: string
  creditorId: string
  amount: number
}

export class CreateReglement {
  constructor(
    private readonly groupes: IGroupeRepository,
    private readonly depenses: IDepenseRepository,
    private readonly services: IServiceRepository,
    private readonly reglements: IReglementRepository
  ) {}

  async execute(userId: string, groupeId: string, input: CreateReglementInput) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw new NotFound('Groupe introuvable')
    }
    if (!groupe.hasMembre(input.debtorId) || !groupe.hasMembre(input.creditorId)) {
      throw new InvalidData('Membre introuvable')
    }
    const depenses = await this.depenses.findByGroupeId(groupeId)
    const services = await this.services.findByGroupeId(groupeId)
    const existing = await this.reglements.findByGroupeId(groupeId)
    const soldes = soldesOf(
      groupe.membres.map(membre => ({ userId: membre.userId, name: membre.name })),
      depenses.map(depense => ({
        payerId: depense.payerId,
        amount: depense.amount.value,
        parts: depense.parts.list
      })),
      services.map(service => ({
        providerId: service.providerId,
        amount: service.amount.value,
        parts: service.parts.list
      })),
      existing.map(reglement => ({
        debtorId: reglement.debtorId,
        creditorId: reglement.creditorId,
        amount: reglement.amount.value
      }))
    )
    const soldeDebiteur = soldes.find(solde => solde.userId === input.debtorId)?.amount ?? 0
    const soldeCreancier = soldes.find(solde => solde.userId === input.creditorId)?.amount ?? 0
    const reglement = Reglement.create(
      groupeId,
      input.debtorId,
      input.creditorId,
      Montant.fromCents(input.amount),
      soldeDebiteur,
      soldeCreancier
    )
    await this.reglements.save(reglement)
    return toGroupeDto(groupe, depenses, services, [...existing, reglement])
  }
}
