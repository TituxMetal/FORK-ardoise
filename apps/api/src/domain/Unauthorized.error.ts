import { DomainError } from './DomainError.error.ts'

export class Unauthorized extends DomainError {
  constructor(message = 'Session requise') {
    super('UNAUTHORIZED', message, 401)
  }
}
