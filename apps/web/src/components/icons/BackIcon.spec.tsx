/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { BackIcon } from './BackIcon'

afterEach(cleanup)

describe('BackIcon', () => {
  it('renders a decorative back arrow hidden from assistive technology', () => {
    const { container } = render(<BackIcon />)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 20 20')
  })
})
