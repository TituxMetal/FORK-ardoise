import { z } from 'zod'

export const renameGroupSchema = z.object({
  name: z.string().trim().min(1, 'Nom du Groupe requis')
})

export type RenameGroupInput = z.infer<typeof renameGroupSchema>
