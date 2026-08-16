import { NotFound } from '../../domain/NotFound.error.ts'
import type { IGroupRepository } from '../domain/IGroup.repository.ts'
import { Membre } from '../domain/Membre.entity.ts'
import { toGroupeDto } from './ToGroupe.mapper.ts'

export class JoinGroupe {
  constructor(private readonly groupes: IGroupRepository) {}

  async execute(userId: string, userName: string, secret: string) {
    const groupe = await this.groupes.findByInvitationSecret(secret)
    if (!groupe) {
      throw new NotFound('Invitation introuvable')
    }
    groupe.addMembre(Membre.of(userId, userName))
    await this.groupes.save(groupe)
    return toGroupeDto(groupe)
  }
}
