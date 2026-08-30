import { z } from 'zod'

export const updateNameSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis')
})

export type UpdateNameInput = z.infer<typeof updateNameSchema>
