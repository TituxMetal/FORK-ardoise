/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { PersonIcon } from './PersonIcon'

afterEach(cleanup)

describe('PersonIcon', () => {
  it('renders a decorative person hidden from assistive technology', () => {
    const { container } = render(<PersonIcon />)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 20 20')
  })
})
