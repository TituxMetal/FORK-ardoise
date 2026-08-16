import type { DomainError } from '../domain/DomainError.ts'
import type { Context } from 'hono'

const isDomainError = (error: Error): error is DomainError =>
  error instanceof Error &&
  'code' in error &&
  'statusCode' in error &&
  typeof error.code === 'string' &&
  typeof error.statusCode === 'number' &&
  [400, 401, 404, 409, 500].includes(error.statusCode)

export const mapException = (error: Error, c: Context) => {
  if (isDomainError(error)) {
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
