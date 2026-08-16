import { domainError, type DomainError } from './DomainError.ts'

export const unauthorized = (message = 'Session requise'): DomainError =>
  domainError('UNAUTHORIZED', message, 401)
