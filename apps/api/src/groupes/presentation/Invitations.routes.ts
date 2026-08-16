import { Hono } from 'hono'
import { JoinGroupe } from '../application/JoinGroupe.uc.ts'
import type { IGroupRepository } from '../domain/IGroup.repository.ts'

export const createInvitationsRoutes = (groupes: IGroupRepository) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const joinGroupe = new JoinGroupe(groupes)

  app.post('/:secret', async c =>
    c.json(await joinGroupe.execute(c.get('userId'), c.get('userName'), c.req.param('secret')))
  )

  return app
}
