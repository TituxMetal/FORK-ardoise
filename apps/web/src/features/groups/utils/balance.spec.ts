import { describe, expect, it } from 'vite-plus/test'
import { selfBalanceLabel } from './balance'

describe('selfBalanceLabel', () => {
  it('says the Group owes the self when the Balance is positive', () => {
    expect(selfBalanceLabel(3850)).toBe('On te doit 38,50 €')
  })

  it('says the self owes the Group when the Balance is negative', () => {
    expect(selfBalanceLabel(-1200)).toBe('Tu dois 12,00 €')
  })

  it('shows a zero Balance as owed to the self', () => {
    expect(selfBalanceLabel(0)).toBe('On te doit 0,00 €')
  })
})
