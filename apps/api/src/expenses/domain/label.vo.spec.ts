import { describe, expect, it } from 'vite-plus/test'
import { LABEL_REQUIRED, labelFrom, labelReconstitute } from './label.vo'

describe('Label', () => {
  it('keeps a non-empty label', () => {
    const label = labelFrom('Pizza')

    expect(label).toEqual({ value: 'Pizza' })
  })

  it('trims surrounding whitespace', () => {
    const label = labelFrom('  Pizza  ')

    expect(label.value).toBe('Pizza')
  })

  it('rejects an empty or blank label', () => {
    const empty = () => labelFrom('')
    const blank = () => labelFrom('   ')

    expect(empty).toThrow(LABEL_REQUIRED)
    expect(blank).toThrow(LABEL_REQUIRED)
  })

  it('reconstitutes a Label without validation', () => {
    const label = labelReconstitute('Pizza')

    expect(label).toEqual({ value: 'Pizza' })
  })
})
