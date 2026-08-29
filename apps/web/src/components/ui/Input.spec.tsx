/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { Input } from './Input'

afterEach(cleanup)

describe('Input', () => {
  it('renders a text field with the shared styling and forwards its props', () => {
    render(<Input name="email" type="email" placeholder="lea@example.com" required />)

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.name).toBe('email')
    expect(input.type).toBe('email')
    expect(input.placeholder).toBe('lea@example.com')
    expect(input.required).toBe(true)
    expect(input.className).toContain('rounded')
  })
})
