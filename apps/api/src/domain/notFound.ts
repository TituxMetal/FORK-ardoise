import { domainError, type DomainError } from '~/domain/DomainError'

export const notFound = (message = 'Introuvable'): DomainError =>
  domainError('NOT_FOUND', message, 404)
