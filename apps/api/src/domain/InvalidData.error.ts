import { DomainError } from './DomainError.error.ts'

export class InvalidData extends DomainError {
  constructor(message: string) {
    super('INVALID_DATA', message, 400)
  }
}
