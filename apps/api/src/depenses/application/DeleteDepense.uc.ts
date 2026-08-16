import { NotFound } from '../../domain/NotFound.error.ts'
import { toGroupeDto } from '../../groupes/application/ToGroupe.mapper.ts'
import type { IGroupeRepository } from '../../groupes/domain/IGroupe.repository.ts'
import type { IDepenseRepository } from '../domain/IDepense.repository.ts'

export class DeleteDepense {
  constructor(
    private readonly groupes: IGroupeRepository,
    private readonly depenses: IDepenseRepository
  ) {}

  async execute(userId: string, groupeId: string, depenseId: string) {
    const groupe = await this.groupes.findById(groupeId)
    if (!groupe || !groupe.hasMembre(userId)) {
      throw new NotFound('Groupe introuvable')
    }
    const depense = await this.depenses.findById(depenseId)
    if (!depense || depense.groupeId !== groupeId) {
      throw new NotFound('Dépense introuvable')
    }
    await this.depenses.delete(depenseId)
    return toGroupeDto(groupe, await this.depenses.findByGroupeId(groupeId))
  }
}
