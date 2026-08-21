import { domainError, type DomainError } from '~/domain/DomainError'

export const unauthorized = (message = 'Session requise'): DomainError =>
  domainError('UNAUTHORIZED', message, 401)
