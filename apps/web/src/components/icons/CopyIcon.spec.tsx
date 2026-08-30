/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { CopyIcon } from './CopyIcon'

afterEach(cleanup)

describe('CopyIcon', () => {
  it('renders a decorative copy icon hidden from assistive technology', () => {
    const { container } = render(<CopyIcon />)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 20 20')
  })
})
