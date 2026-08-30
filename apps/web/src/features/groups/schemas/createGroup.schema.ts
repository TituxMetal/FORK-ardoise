import { z } from 'zod'

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Nom du Groupe requis')
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>
