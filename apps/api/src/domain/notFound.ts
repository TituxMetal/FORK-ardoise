import { domainError, type DomainError } from './DomainError.ts'

export const notFound = (message = 'Introuvable'): DomainError =>
  domainError('NOT_FOUND', message, 404)
