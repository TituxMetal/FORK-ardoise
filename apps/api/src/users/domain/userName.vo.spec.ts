import { describe, expect, it } from 'vite-plus/test'
import { USER_NAME_REQUIRED, userNameFrom } from './userName.vo'

describe('userNameFrom', () => {
  it('accepts a non-blank name trimmed of surrounding spaces', () => {
    expect(userNameFrom('  Léa  ').value).toBe('Léa')
  })

  it('refuses a blank name with the French domain rule', () => {
    expect(() => userNameFrom('   ')).toThrow(USER_NAME_REQUIRED)
  })
})
