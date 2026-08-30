/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { DownIcon } from './DownIcon'

afterEach(cleanup)

describe('DownIcon', () => {
  it('renders a decorative arrow hidden from assistive technology', () => {
    const { container } = render(<DownIcon />)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 20 20')
  })
})
