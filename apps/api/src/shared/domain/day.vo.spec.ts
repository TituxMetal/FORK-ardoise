import { describe, expect, it } from 'vite-plus/test'
import { DAY_REQUIRED, dayFrom, dayReconstitute } from './day.vo'

describe('Day', () => {
  it('keeps an ISO date', () => {
    const day = dayFrom('2026-08-15')

    expect(day).toEqual({ value: '2026-08-15' })
  })

  it('trims surrounding whitespace', () => {
    const day = dayFrom(' 2026-08-15 ')

    expect(day.value).toBe('2026-08-15')
  })

  it('rejects anything but an ISO date', () => {
    const short = () => dayFrom('2026-08')
    const notIso = () => dayFrom('15/08/2026')

    expect(short).toThrow(DAY_REQUIRED)
    expect(notIso).toThrow(DAY_REQUIRED)
  })

  it('rejects impossible calendar dates', () => {
    expect(() => dayFrom('2026-02-31')).toThrow(DAY_REQUIRED)
    expect(() => dayFrom('2026-13-01')).toThrow(DAY_REQUIRED)
    expect(() => dayFrom('2026-00-10')).toThrow(DAY_REQUIRED)
    expect(() => dayFrom('2023-02-29')).toThrow(DAY_REQUIRED)
  })

  it('accepts a leap day', () => {
    expect(dayFrom('2024-02-29')).toEqual({ value: '2024-02-29' })
  })

  it('reconstitutes a Day without validation', () => {
    const day = dayReconstitute('2026-08-15')

    expect(day).toEqual({ value: '2026-08-15' })
  })
})
