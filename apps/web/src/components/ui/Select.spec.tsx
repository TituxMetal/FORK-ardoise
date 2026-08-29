/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { Select } from './Select'

afterEach(cleanup)

describe('Select', () => {
  it('renders a select with the shared styling and its options', () => {
    render(
      <Select name="payerId" defaultValue="lea">
        <option value="lea">Léa</option>
        <option value="bob">Bob</option>
      </Select>
    )

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.name).toBe('payerId')
    expect(select.value).toBe('lea')
    expect([...select.options].map(option => option.textContent)).toEqual(['Léa', 'Bob'])
    expect(select.className).toContain('rounded')
  })
})
