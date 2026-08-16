import { domainError, type DomainError } from './DomainError.ts'

export const invalidData = (message: string): DomainError =>
  domainError('INVALID_DATA', message, 400)
