import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().trim().min(1, 'E-mail requis').pipe(z.email('E-mail invalide')),
  password: z.string().min(1, 'Mot de passe requis')
})

export type SignInFormInput = z.infer<typeof signInSchema>
