import type { DomainError } from '../domain/DomainError.ts'
import type { Context } from 'hono'

export const mapException = (error: Error, c: Context) => {
  if ('code' in error && 'statusCode' in error) {
    const domain = error as DomainError
    return c.json(
      {
        statusCode: domain.statusCode,
        code: domain.code,
        message: domain.message
      },
      domain.statusCode as 400 | 401 | 404 | 409 | 500
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
