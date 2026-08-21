import { domainError, type DomainError } from '~/domain/DomainError'

export const invalidData = (message: string): DomainError =>
  domainError('INVALID_DATA', message, 400)
