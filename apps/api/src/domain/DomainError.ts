export type DomainError = Error & {
  code: string
  statusCode: number
}

export const domainError = (code: string, message: string, statusCode: number): DomainError => {
  const error = new Error(message) as DomainError
  error.name = code
  error.code = code
  error.statusCode = statusCode
  return error
}
