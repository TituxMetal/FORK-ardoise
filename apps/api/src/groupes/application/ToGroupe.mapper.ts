import type { Groupe } from '../domain/Groupe.entity.ts'
import type { GroupeDto } from './Groupe.dto.ts'

export const toGroupeDto = (groupe: Groupe): GroupeDto => {
  const members = groupe.membres.map(membre => ({
    userId: membre.userId,
    name: membre.name
  }))
  return {
    id: groupe.id,
    name: groupe.name.value,
    members,
    expenses: [],
    services: [],
    settlements: [],
    balances: members.map(membre => ({ ...membre, amount: 0 }))
  }
}
