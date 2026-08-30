/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { PlusIcon } from './PlusIcon'

afterEach(cleanup)

describe('PlusIcon', () => {
  it('renders a decorative plus hidden from assistive technology', () => {
    const { container } = render(<PlusIcon />)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 20 20')
  })
})
