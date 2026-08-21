import { domainError, type DomainError } from './domainError.vo'

export const invalidData = (message: string): DomainError =>
  domainError('INVALID_DATA', message, 400)
