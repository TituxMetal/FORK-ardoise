import { describe, expect, it } from 'vite-plus/test'
import { dayLabel, initials } from './format'

describe('initials', () => {
  it('takes the first two characters of the first name, uppercased', () => {
    expect(initials('Léa')).toBe('LÉ')
    expect(initials('Bob')).toBe('BO')
  })

  it('ignores any further names', () => {
    expect(initials('Alice Dupont')).toBe('AL')
  })
})

describe('dayLabel', () => {
  it('renders an ISO day as a French day label', () => {
    expect(dayLabel('2026-08-18')).toBe('18 août')
    expect(dayLabel('2026-01-05')).toBe('5 janvier')
    expect(dayLabel('2026-12-31')).toBe('31 décembre')
  })
})
