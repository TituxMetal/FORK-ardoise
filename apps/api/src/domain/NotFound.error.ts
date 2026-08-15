import { DomainError } from './DomainError.error.ts'

export class NotFound extends DomainError {
  constructor(message = 'Introuvable') {
    super('NOT_FOUND', message, 404)
  }
}
