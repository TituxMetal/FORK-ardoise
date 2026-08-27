export type Member = {
  userId: string
  name: string
}

export const memberOf = (userId: string, name: string): Member => ({ userId, name })

export const memberReconstitute = (userId: string, name: string): Member => ({ userId, name })
