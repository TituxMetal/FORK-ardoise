import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { invalidData } from '~/shared/domain'

export const validateBody = <Schema extends z.ZodType>(schema: Schema) =>
  zValidator('json', schema, result => {
    if (!result.success) {
      throw invalidData('Format invalide')
    }
  })
