import { Groupe } from '../domain/Groupe.entity.ts'
import { GroupeName } from '../domain/GroupeName.vo.ts'
import { Membre } from '../domain/Membre.entity.ts'

export const toGroupe = (row: {
  id: string
  name: string
  invitationSecret: string
  membres: { userId: string; name: string }[]
}) =>
  Groupe.reconstitute(
    row.id,
    GroupeName.reconstitute(row.name),
    row.membres.map(membre => Membre.reconstitute(membre.userId, membre.name)),
    row.invitationSecret
  )
