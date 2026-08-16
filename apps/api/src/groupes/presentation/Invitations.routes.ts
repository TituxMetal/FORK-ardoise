import { Hono } from 'hono'
import { JoinGroupe } from '../application/JoinGroupe.uc.ts'
import type { IGroupeRepository } from '../domain/IGroupe.repository.ts'

export const createInvitationsRoutes = (groupes: IGroupeRepository) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const joinGroupe = new JoinGroupe(groupes)

  app.post('/:secret', async c =>
    c.json(await joinGroupe.execute(c.get('userId'), c.get('userName'), c.req.param('secret')))
  )

  return app
}
