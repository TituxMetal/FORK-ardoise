import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import type { IDepenseRepository } from '../../depenses/domain/IDepense.repository.ts'
import { InvalidData } from '../../domain/InvalidData.error.ts'
import { Montant } from '../../domain/Montant.vo.ts'
import type { IGroupeRepository } from '../../groupes/domain/IGroupe.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { CreateReglement } from '../application/CreateReglement.uc.ts'
import { DeleteReglement } from '../application/DeleteReglement.uc.ts'
import type { IReglementRepository } from '../domain/IReglement.repository.ts'

const createReglementBody = z.object({
  debtorId: z.string(),
  creditorId: z.string(),
  amount: z.number({ error: Montant.POSITIVE })
})

export const createReglementsRoutes = (
  groupes: IGroupeRepository,
  depenses: IDepenseRepository,
  services: IServiceRepository,
  reglements: IReglementRepository
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const createReglement = new CreateReglement(groupes, depenses, services, reglements)
  const deleteReglement = new DeleteReglement(groupes, depenses, services, reglements)

  app.post(
    '/:groupeId/settlements',
    zValidator('json', createReglementBody, result => {
      if (!result.success) {
        const issue = result.error.issues[0]
        throw new InvalidData(issue?.message ?? Montant.POSITIVE)
      }
    }),
    async c => {
      const groupe = await createReglement.execute(
        c.get('userId'),
        c.req.param('groupeId'),
        c.req.valid('json')
      )
      return c.json(groupe, 201)
    }
  )

  app.delete('/:groupeId/settlements/:id', async c =>
    c.json(
      await deleteReglement.execute(c.get('userId'), c.req.param('groupeId'), c.req.param('id'))
    )
  )

  return app
}
