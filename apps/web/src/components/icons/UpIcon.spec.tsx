/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { UpIcon } from './UpIcon'

afterEach(cleanup)

describe('UpIcon', () => {
  it('renders a decorative up arrow hidden from assistive technology', () => {
    const { container } = render(<UpIcon />)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 20 20')
  })
})
