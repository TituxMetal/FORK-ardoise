import { describe, expect, it } from 'vite-plus/test'
import { GROUP_NAME_REQUIRED, groupNameFrom, groupNameReconstitute } from './groupName.vo'

describe('GroupName', () => {
  it('keeps a non-empty name', () => {
    const name = groupNameFrom('Potes de Bob')

    expect(name).toEqual({ value: 'Potes de Bob' })
  })

  it('trims surrounding whitespace', () => {
    const name = groupNameFrom('  Potes de Bob  ')

    expect(name.value).toBe('Potes de Bob')
  })

  it('rejects an empty or blank name', () => {
    const empty = () => groupNameFrom('')
    const blank = () => groupNameFrom('   ')

    expect(empty).toThrow(GROUP_NAME_REQUIRED)
    expect(blank).toThrow(GROUP_NAME_REQUIRED)
  })

  it('reconstitutes a GroupName without validation', () => {
    const name = groupNameReconstitute('Potes de Bob')

    expect(name).toEqual({ value: 'Potes de Bob' })
  })
})
