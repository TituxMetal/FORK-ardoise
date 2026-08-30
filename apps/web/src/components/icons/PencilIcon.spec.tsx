/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { PencilIcon } from './PencilIcon'

afterEach(cleanup)

describe('PencilIcon', () => {
  it('renders a decorative pencil hidden from assistive technology', () => {
    const { container } = render(<PencilIcon />)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 20 20')
  })
})
