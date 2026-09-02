import { describe, expect, it } from 'vite-plus/test'
import { amountFromCents, PARTICIPANTS_REQUIRED, dayReconstitute } from '~/shared/domain'
import { expenseCreate, expenseUpdate } from './expense.entity'
import { labelReconstitute } from './label.vo'

const label = labelReconstitute('Pizza')
const day = dayReconstitute('2026-08-15')

describe('Expense', () => {
  it('splits the Amount equally and gives the remainder to the Payer', () => {
    const expense = expenseCreate('group', label, day, amountFromCents(100), 'lea', [
      'lea',
      'bob',
      'camille'
    ])

    expect(expense.participantIds).toEqual(['lea', 'bob', 'camille'])
    expect(expense.parts).toEqual([
      { userId: 'lea', amount: amountFromCents(34) },
      { userId: 'bob', amount: amountFromCents(33) },
      { userId: 'camille', amount: amountFromCents(33) }
    ])
  })

  it('adds a Part for a Payer outside Participants holding the remainder', () => {
    const expense = expenseCreate('group', label, day, amountFromCents(101), 'lea', [
      'bob',
      'camille'
    ])

    expect(expense.parts).toEqual([
      { userId: 'bob', amount: amountFromCents(50) },
      { userId: 'camille', amount: amountFromCents(50) },
      { userId: 'lea', amount: amountFromCents(1) }
    ])
  })

  it('refuses zero Participants', () => {
    expect(() => expenseCreate('group', label, day, amountFromCents(100), 'lea', [])).toThrow(
      PARTICIPANTS_REQUIRED
    )
  })
  it('keeps the id and re-derives the split when updated', () => {
    const expense = expenseUpdate('e1', 'group', label, day, amountFromCents(200), 'bob', [
      'bob',
      'camille'
    ])

    expect(expense.id).toBe('e1')
    expect(expense.payerId).toBe('bob')
    expect(expense.participantIds).toEqual(['bob', 'camille'])
    expect(expense.parts).toEqual([
      { userId: 'bob', amount: amountFromCents(100) },
      { userId: 'camille', amount: amountFromCents(100) }
    ])
  })

  it('refuses zero Participants when updated', () => {
    expect(() => expenseUpdate('e1', 'group', label, day, amountFromCents(100), 'lea', [])).toThrow(
      PARTICIPANTS_REQUIRED
    )
  })
})
