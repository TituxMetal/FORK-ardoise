/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { FormWrapper } from './FormWrapper'
import { Input } from './Input'

afterEach(cleanup)

describe('FormWrapper', () => {
  it('wraps a control in a label associated with the given text', () => {
    render(
      <FormWrapper label="Nom">
        <Input name="name" required />
      </FormWrapper>
    )

    expect(screen.getByLabelText('Nom').getAttribute('name')).toBe('name')
  })

  it('marks the control invalid and announces the French error message', () => {
    render(
      <FormWrapper label="Nom" error="Le nom est requis">
        <Input name="name" />
      </FormWrapper>
    )

    const input = screen.getByLabelText('Nom')
    const message = screen.getByRole('alert')

    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(message.textContent).toBe('Le nom est requis')
    expect(input.getAttribute('aria-describedby')).toBe(message.getAttribute('id'))
  })

  it('renders no error message when the field is valid', () => {
    render(
      <FormWrapper label="Nom">
        <Input name="name" />
      </FormWrapper>
    )

    const input = screen.getByLabelText('Nom')
    expect(input.getAttribute('aria-invalid')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
