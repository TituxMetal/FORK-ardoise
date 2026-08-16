import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { InvalidData } from '../../domain/InvalidData.error.ts'
import { Montant } from '../../domain/Montant.vo.ts'
import type { IGroupRepository } from '../../groupes/domain/IGroup.repository.ts'
import type { IPaybackRepository } from '../../reglements/domain/IPayback.repository.ts'
import type { IServiceRepository } from '../../services/domain/IService.repository.ts'
import { CreateDepense } from '../application/CreateDepense.uc.ts'
import { DeleteDepense } from '../application/DeleteDepense.uc.ts'
import type { IExpenseRepository } from '../domain/IExpense.repository.ts'
import { Jour } from '../domain/Jour.vo.ts'
import { Libelle } from '../domain/Libelle.vo.ts'

const createDepenseBody = z.object({
  label: z.string({ error: Libelle.REQUIRED }),
  day: z.string({ error: Jour.REQUIRED }),
  amount: z.number({ error: Montant.POSITIVE }),
  payerId: z.string(),
  participantIds: z.array(z.string()).optional()
})

export const createDepensesRoutes = (
  groupes: IGroupRepository,
  depenses: IExpenseRepository,
  services: IServiceRepository,
  reglements: IPaybackRepository
) => {
  const app = new Hono<{ Variables: { userId: string; userName: string } }>()
  const createDepense = new CreateDepense(groupes, depenses, services, reglements)
  const deleteDepense = new DeleteDepense(groupes, depenses, services, reglements)

  app.post(
    '/:groupeId/expenses',
    zValidator('json', createDepenseBody, result => {
      if (!result.success) {
        const issue = result.error.issues[0]
        throw new InvalidData(issue?.message ?? Libelle.REQUIRED)
      }
    }),
    async c => {
      const groupe = await createDepense.execute(
        c.get('userId'),
        c.req.param('groupeId'),
        c.req.valid('json')
      )
      return c.json(groupe, 201)
    }
  )

  app.delete('/:groupeId/expenses/:id', async c =>
    c.json(await deleteDepense.execute(c.get('userId'), c.req.param('groupeId'), c.req.param('id')))
  )

  return app
}
