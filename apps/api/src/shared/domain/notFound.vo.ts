import { domainError, type DomainError } from './domainError.vo'

export const notFound = (message = 'Introuvable'): DomainError =>
  domainError('NOT_FOUND', message, 404)
