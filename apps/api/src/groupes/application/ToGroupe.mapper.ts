import type { Depense } from '../../depenses/domain/Depense.entity.ts'
import { soldesOf } from '../../domain/Solde.ts'
import type { Service } from '../../services/domain/Service.entity.ts'
import type { Groupe } from '../domain/Groupe.entity.ts'
import type { GroupeDto } from './Groupe.dto.ts'

export const toGroupeDto = (
  groupe: Groupe,
  depenses: Depense[] = [],
  services: Service[] = []
): GroupeDto => {
  const members = groupe.membres.map(membre => ({
    userId: membre.userId,
    name: membre.name
  }))
  return {
    id: groupe.id,
    name: groupe.name.value,
    members,
    invitation: { secret: groupe.invitationSecret },
    expenses: depenses.map(depense => ({
      id: depense.id,
      label: depense.label.value,
      day: depense.day.value,
      amount: depense.amount.value,
      payerId: depense.payerId,
      participantIds: depense.participantIds,
      parts: depense.parts.list.map(part => ({
        userId: part.userId,
        amount: part.amount.value
      }))
    })),
    services: services.map(service => ({
      id: service.id,
      label: service.label.value,
      day: service.day.value,
      amount: service.amount.value,
      providerId: service.providerId,
      participantIds: service.participantIds,
      parts: service.parts.list.map(part => ({
        userId: part.userId,
        amount: part.amount.value
      }))
    })),
    settlements: [],
    balances: soldesOf(
      members,
      depenses.map(depense => ({
        payerId: depense.payerId,
        amount: depense.amount.value,
        parts: depense.parts.list
      })),
      services.map(service => ({
        providerId: service.providerId,
        amount: service.amount.value,
        parts: service.parts.list
      }))
    )
  }
}
