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
})
