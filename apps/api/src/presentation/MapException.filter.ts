import { DomainError } from '../domain/DomainError.error.ts'
import type { Context } from 'hono'

export const mapException = (error: Error, c: Context) => {
  if (error instanceof DomainError) {
    return c.json(
      {
        statusCode: error.statusCode,
        code: error.code,
        message: error.message
      },
      error.statusCode as 400 | 401 | 404 | 409 | 500
    )
  }

  return c.json(
    {
      statusCode: 500,
      code: 'INTERNAL',
      message: 'Erreur interne'
    },
    500
  )
}
