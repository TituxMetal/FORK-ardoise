import { domainError, type DomainError } from './domainError.vo'

export const unauthorized = (message = 'Session requise'): DomainError =>
  domainError('UNAUTHORIZED', message, 401)
