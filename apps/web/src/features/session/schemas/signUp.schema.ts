import { z } from 'zod'

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis'),
  email: z.string().trim().min(1, 'E-mail requis').pipe(z.email('E-mail invalide')),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum')
})

export type SignUpFormInput = z.infer<typeof signUpSchema>
